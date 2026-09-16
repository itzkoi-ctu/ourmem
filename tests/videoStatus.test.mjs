import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { QueryClient } from '@tanstack/react-query';

// Execute the same parser used by the hook, without introducing a test runner dependency.
const source = await readFile(new URL('../src/api/videoStatus.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { parseVideoStatus } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('first upload: omitted data is a successful empty query, not an error', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  try {
    const result = await client.fetchQuery({ queryKey: ['video-status', 'new-session'], queryFn: async () => parseVideoStatus({ success: true }) });
    assert.equal(result, null);
    assert.equal(client.getQueryState(['video-status', 'new-session']).status, 'success');
  } finally { client.clear(); }
});

test('explicit null is an empty status', () => assert.equal(parseVideoStatus({ success: true, data: null }), null));

test('processing and terminal jobs are preserved', () => {
  for (const status of ['PROCESSING', 'READY', 'FAILED']) {
    const job = { id: 'job-1', status };
    assert.equal(parseVideoStatus({ success: true, data: job }), job);
  }
});

test('failed or malformed responses are not mistaken for permission to upload', () => {
  assert.throws(() => parseVideoStatus({ success: false }));
  assert.throws(() => parseVideoStatus({ success: true, data: { id: 'x', status: 'UNKNOWN' } }));
});
