import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://elohim-presenca.onrender.com',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@App:token');


  if (token && !config.url?.includes('/auth/login')) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});