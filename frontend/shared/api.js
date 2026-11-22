const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const API_BASE_URL = isLocalhost
  ? `http://${window.location.hostname}:5001/api`
  : 'https://shopsphere-4v8h.onrender.com/api';

async function apiRequest(endpoint, options = {}) {
  const headers = {
    ...(options.headers || {})
  };

  const token = window.localStorage.getItem('shopsphere_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body !== undefined && options.body !== null) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const config = {
    ...options,
    headers,
    credentials: 'include'
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (
    (endpoint === '/auth/login' || endpoint === '/auth/register') &&
    response.ok &&
    data.token
  ) {
    window.localStorage.setItem('shopsphere_token', data.token);
  }

  if (endpoint === '/auth/logout') {
    window.localStorage.removeItem('shopsphere_token');
  }

  if (response.status === 401) {
    window.localStorage.removeItem('shopsphere_token');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}