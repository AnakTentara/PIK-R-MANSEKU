import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ── Request Interceptor: Attach JWT ── */
api.interceptors.request.use(
  (config) => {
    // Check admin token first, then candidate token
    const adminToken = localStorage.getItem('admin_token');
    const candidateToken = localStorage.getItem('candidate_token');
    const token = adminToken || candidateToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response Interceptor: Handle 401 ── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAdmin = window.location.pathname.startsWith('/admin');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('candidate_token');
      if (isAdmin) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
