import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import axios from 'axios';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/api/securityClient.ts', import.meta.url), 'utf8')
  .replace("from 'axios'", 'from ' + JSON.stringify(pathToFileURL(require.resolve('axios')).href));
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { createSecurityClient } = await import('data:text/javascript;base64,' + Buffer.from(output).toString('base64'));

function fixture(lock) {
  const state = { access: false, ends: 0, refreshes: 0, csrf: 0, refreshStatus: 200, refreshDelay: null, privateDelay: null, requests: [] };
  const api = createSecurityClient('https://api.example.test', () => { state.ends++; }, lock);
  const response = (config, status, data) => ({ config, status, data, statusText: String(status), headers: {} });
  const reject = (config, status, message) => { throw new axios.AxiosError(message, 'TEST', config, {}, response(config, status, { message })); };
  const adapter = async config => {
    state.requests.push(config);
    if (config.url === '/auth/csrf') { state.csrf++; return response(config, 200, { data: { token: 'csrf-test' } }); }
    if (config.url === '/auth/refresh') {
      state.refreshes++;
      if (state.refreshDelay) await state.refreshDelay;
      if (state.refreshStatus !== 200) return reject(config, state.refreshStatus, 'Refresh failed');
      state.access = true;
      return response(config, 200, { data: {} });
    }
    if (config.url === '/auth/login') { state.access = true; return response(config, 200, { data: { userId: 'owner' } }); }
    if (config.url === '/auth/logout') { state.access = false; return response(config, 200, {}); }
    if (config.url.startsWith('/public/')) return response(config, 200, {});
    if (!state.access) return reject(config, 401, 'Authentication required');
    if (state.privateDelay) await state.privateDelay;
    return response(config, 200, { data: { id: 'owner' } });
  };
  api.transport.defaults.adapter = adapter;
  api.client.defaults.adapter = adapter;
  return { api, state, response, reject };
}

test('restore /auth/me refreshes expired access and retries', async () => {
  const { api, state } = fixture();
  assert.equal((await api.client.get('/auth/me')).status, 200);
  assert.equal(state.refreshes, 1);
  assert.equal(state.ends, 0);
});
test('concurrent 401s share exactly one refresh and send no bearer token', async () => {
  const { api, state } = fixture();
  await Promise.all(['/sessions', '/photos', '/video/status'].map(url => api.client.get(url)));
  assert.equal(state.refreshes, 1);
  assert.ok(state.requests.every(request => !request.headers.get('Authorization')));
});
test('invalid refresh ends session; further private requests cannot refresh it', async () => {
  const { api, state } = fixture(); state.refreshStatus = 401;
  await assert.rejects(api.client.get('/auth/me'));
  assert.equal(state.ends, 1);
  await assert.rejects(api.client.get('/sessions'));
  assert.equal(state.refreshes, 1);
  assert.equal((await api.client.get('/public/sessions')).status, 200);
});
test('temporary server failure does not discard the session', async () => {
  const { api, state } = fixture(); state.refreshStatus = 503;
  await assert.rejects(api.client.get('/sessions'));
  assert.equal(state.ends, 0);
  state.refreshStatus = 200;
  assert.equal((await api.client.get('/sessions')).status, 200);
});
test('403 permission errors never refresh', async () => {
  const { api, state, reject } = fixture();
  api.client.defaults.adapter = config => reject(config, 403, 'Access denied');
  await assert.rejects(api.client.get('/sessions'));
  assert.equal(state.refreshes, 0);
});
test('login and logout attach CSRF header', async () => {
  const { api, state } = fixture();
  await api.login({ email: 'owner@example.test', password: 'test' });
  await api.logout();
  for (const path of ['/auth/login', '/auth/logout']) {
    assert.equal(state.requests.find(config => config.url === path).headers.get('X-XSRF-TOKEN'), 'csrf-test');
  }
  await assert.rejects(api.client.get('/sessions'));
});
test('CSRF mismatch re-fetches token once, without token-refresh loop', async () => {
  const { api, state, response, reject } = fixture();
  let attempts = 0;
  api.client.defaults.adapter = async config => {
    attempts++;
    if (attempts === 1) return reject(config, 403, 'CSRF_INVALID');
    assert.equal(config.headers.get('X-XSRF-TOKEN'), 'csrf-test');
    return response(config, 200, {});
  };
  await api.client.post('/sessions', {});
  assert.equal(attempts, 2); assert.equal(state.csrf, 2); assert.equal(state.refreshes, 0);
});
test('late private response cannot restore data after logout', async () => {
  const { api, state } = fixture(); state.access = true;
  let release;
  state.privateDelay = new Promise(resolve => { release = resolve; });
  const pending = api.client.get('/sessions');
  const rejected = assert.rejects(pending);
  await new Promise(resolve => setImmediate(resolve));
  await api.logout();
  release();
  await rejected;
});
test('logout waits for refresh then revokes latest cookies', async () => {
  const { api, state } = fixture();
  let release;
  state.refreshDelay = new Promise(resolve => { release = resolve; });
  const pending = api.client.get('/sessions').catch(() => undefined);
  await new Promise(resolve => setImmediate(resolve));
  const logout = api.logout();
  release();
  await Promise.all([pending, logout]);
  assert.equal(state.access, false);
  assert.equal(state.requests.filter(c => c.url === '/auth/logout').length, 1);
  await assert.rejects(api.client.get('/sessions'));
});
test('two tabs sharing a Web Lock recheck cookies rather than rotating twice', async () => {
  let queue = Promise.resolve();
  const lock = work => {
    const next = queue.catch(() => undefined).then(work);
    queue = next;
    return next;
  };
  const { api, state } = fixture(lock);
  const tab = createSecurityClient('https://api.example.test', () => {}, lock);
  tab.transport.defaults.adapter = api.transport.defaults.adapter;
  tab.client.defaults.adapter = api.client.defaults.adapter;
  await Promise.all([api.client.get('/sessions'), tab.client.get('/photos')]);
  assert.equal(state.refreshes, 1);
});
