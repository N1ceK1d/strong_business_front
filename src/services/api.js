import axios from 'axios';

const api = axios.create({
  //baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3005/api',
  baseURL: "https://n1cek1d-strong-busienss-api-d0ee.twc1.net/api"
  // baseURL: "https://n1cek1d-strong-busienss-api-d0ee.twc1.net/api"
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

api.interceptors.response.use(response => response, error => {
  if (error.response && error.response.status === 401) {
    // Перенаправляем только если мы не на странице входа
    if (!window.location.pathname.includes('/authorization')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_info');
      window.location.href = '/authorization';
    }
  }
  return Promise.reject(error);
});

export default api;