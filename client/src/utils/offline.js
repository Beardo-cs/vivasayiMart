// Offline / PWA helpers
import { isNative } from './native';
export const API_CACHE = 'vm-api-v1'; // must match public/sw.js

// Forget cached API responses (call on login/logout so users never see each other's data)
export const clearApiCache = async () => {
  try {
    if ('caches' in window) await window.caches.delete(API_CACHE);
  } catch (e) { /* cache API unavailable: nothing to clear */ }
};

export const registerServiceWorker = () => {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator) || isNative()) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.warn('Service worker registration failed:', err));
  });
};

// True when an axios error means "no connection" (as opposed to the server saying no)
export const isOfflineError = err =>
  !err.response || (err.response.status === 503 && err.response.headers && err.response.headers['x-offline']);
