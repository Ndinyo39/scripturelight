const API_URL = '/api';

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Auto-logout on authentication failures (stale/invalid tokens)
  if (response.status === 401 || response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.message || '';
    // Only clear session on true auth failures, not "pending account" messages
    if (msg.includes('not valid') || msg.includes('No token') || msg.includes('denied')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      // Redirect to login only if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }
    throw new Error(msg || 'Access denied');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Something went wrong' }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
};

export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) => apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

export const fetchBibleVerses = async (book, chapter, translation = 'kjv') => {
  // Using labs.bible.org or similar open API
  // For now, using a more reliable one: bible-api.com
  const response = await fetch(`https://bible-api.com/${book}+${chapter}?translation=${translation}`);
  if (!response.ok) throw new Error('Bible API failed');
  return response.json();
};
