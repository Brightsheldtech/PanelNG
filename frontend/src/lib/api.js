import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('panelng_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('panelng_token');
      localStorage.removeItem('panelng_user');
      localStorage.removeItem('panelng_last_active');
      const isMobile = window.innerWidth <= 768;
      window.location.href = isMobile ? '/login' : '/';
    }
    return Promise.reject(err);
  }
);

export default api;
