import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

type Config = InternalAxiosRequestConfig & { _retry?: boolean; _csrfRetry?: boolean; _generation?: number };
type Lock = <T>(work: () => Promise<T>) => Promise<T>;

// Factory permits isolated tests without browser storage, real accounts or network.
export function createSecurityClient(baseURL: string, onSessionEnd: () => void,
  crossTabLock: Lock = work => work()) {
  let authQueue: Promise<unknown> = Promise.resolve();
  const lock: Lock = work => {
    const next = authQueue.catch(() => undefined).then(() => crossTabLock(work));
    authQueue = next;
    return next;
  };
  const options = { baseURL, withCredentials: true };
  const transport = axios.create({ ...options, timeout: 15000 });
  const client = axios.create(options);
  let csrf: string | undefined;
  let csrfFlight: Promise<string> | undefined;
  let refreshFlight: Promise<void> | undefined;
  let generation = 0;
  let signedOut = false;

  function endSession() {
    generation++;
    signedOut = true;
    csrf = undefined;
    onSessionEnd();
  }

  async function csrfToken(): Promise<string> {
    if (csrf) return csrf;
    if (!csrfFlight) {
      csrfFlight = transport.get('/auth/csrf').then(response => {
        const token = response.data?.data?.token;
        if (typeof token !== 'string' || !token) throw new Error('Unable to initialize request protection');
        csrf = token;
        return token;
      }).finally(() => { csrfFlight = undefined; });
    }
    return csrfFlight;
  }

  const isCsrfError = (error: any) => error.response?.status === 403 && error.response?.data?.message === 'CSRF_INVALID';
  const unauthorized = () => new axios.CanceledError('Session has ended');
  const checkGeneration = (expected: number) => { if (expected !== generation) throw unauthorized(); };

  async function authPost(path: string, data = {}) {
    const send = async () => transport.post(path, data, { headers: { 'X-XSRF-TOKEN': await csrfToken() } });
    try { return await send(); }
    catch (error) {
      if (!isCsrfError(error)) throw error;
      csrf = undefined;
      return send();
    }
  }

  async function refresh(expected: number) {
    if (!refreshFlight) {
      refreshFlight = lock(async () => {
        checkGeneration(expected);
        if (signedOut) throw unauthorized();
        // Another tab or an earlier request may already have rotated the cookies.
        try { await transport.get('/auth/me'); return; }
        catch (error) { if ((error as AxiosError).response?.status !== 401) throw error; }
        checkGeneration(expected);
        await authPost('/auth/refresh');
        checkGeneration(expected);
      }).catch(error => {
        if ((error as AxiosError).response?.status === 401 && expected === generation) endSession();
        throw error;
      }).finally(() => { refreshFlight = undefined; });
    }
    await refreshFlight;
  }

  client.interceptors.request.use(async (request: Config) => {
    if (request._generation !== undefined) checkGeneration(request._generation);
    request._generation = generation;
    const publicRequest = request.url?.startsWith('/public/') || request.url === '/health';
    if (signedOut && !publicRequest) throw unauthorized();
    if (!['get', 'head', 'options'].includes((request.method || 'get').toLowerCase())) {
      request.headers.set('X-XSRF-TOKEN', await csrfToken());
      checkGeneration(request._generation);
    }
    return request;
  });

  client.interceptors.response.use(response => {
    checkGeneration((response.config as Config)._generation!);
    return response;
  }, async error => {
    const request = error.config as Config | undefined;
    if (!request || axios.isCancel(error)) throw error;
    checkGeneration(request._generation!);
    if (isCsrfError(error) && !request._csrfRetry) {
      request._csrfRetry = true; csrf = undefined;
      return client(request);
    }
    if (error.response?.status === 401 && !request.url?.startsWith('/public/')) {
      if (request._retry) { endSession(); throw error; }
      request._retry = true;
      await refresh(request._generation!);
      checkGeneration(request._generation!);
      return client(request);
    }
    throw error;
  });

  return {
    client, transport, endSession,
    login: (data: { email: string; password: string }) => lock(async () => {
      const response = await authPost('/auth/login', data);
      generation++; signedOut = false; csrf = undefined;
      onSessionEnd(); // Drop any prior account's cached data before accepting the new user.
      return response;
    }),
    logout: () => lock(async () => {
      // Wait for a cross-tab refresh before revoking its latest refresh cookie.
      await authPost('/auth/logout');
      endSession();
    }),
  };
}
