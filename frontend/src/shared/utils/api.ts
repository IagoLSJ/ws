import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth');
  if (stored) {
    const { accessToken } = JSON.parse(stored);
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const stored = localStorage.getItem('auth');
      if (stored) {
        const { refreshToken } = JSON.parse(stored);
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('auth', JSON.stringify(data));
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('auth');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
