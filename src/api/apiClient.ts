import { createSecurityClient } from './securityClient';
import axios from 'axios';
import toast from 'react-hot-toast';

const listeners = new Set<() => void>();
export const onSessionEnded = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

// Remove legacy bearer tokens. Authentication now uses HttpOnly cookies only.
try { localStorage.removeItem('access_token'); } catch { /* Storage may be disabled. */ }
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ourmem-auth') : undefined;
let remoteEvent = false;
const security = createSecurityClient(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  () => {
    listeners.forEach(listener => listener());
    if (!remoteEvent) channel?.postMessage('session-ended');
  },
  work => typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request('ourmem-auth', work)
    : work(),
);
if (channel) channel.onmessage = event => {
  if (event.data !== 'session-ended') return;
  remoteEvent = true;
  security.endSession();
  remoteEvent = false;
};

security.client.interceptors.response.use(response => response, error => {
  if (!axios.isCancel(error) && error.response?.status !== 401 && error.config?.url !== '/auth/me') {
    const message = error.response?.data?.message === 'CSRF_INVALID'
      ? 'Request protection failed. Please allow cookies for this site and reload.'
      : error.response?.data?.message || 'Unable to complete the request. Please try again.';
    toast.error(message, { id: 'api-error' });
  }
  return Promise.reject(error);
});

export const login = security.login;
export const logout = security.logout;
export default security.client;
