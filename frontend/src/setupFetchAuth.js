// Every backend route in this app (except /api/auth/*) now requires a
// valid session (see backend/index.js). Rather than adding an Authorization
// header to every individual fetch() call across the app's pages, patch
// window.fetch once here so any request to our own API picks up the
// current token automatically. Explicit Authorization headers a caller
// already sets are left untouched.
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3003';

const originalFetch = window.fetch.bind(window);

window.fetch = (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url || '';

  if (url.startsWith(API_BASE) || url.startsWith('/api')) {
    const token = localStorage.getItem('authToken');
    if (token) {
      const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
      if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
      init = { ...init, headers };
    }
  }

  return originalFetch(input, init);
};
