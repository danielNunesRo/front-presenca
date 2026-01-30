import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://elohim-presenca.onrender.com',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@App:token');

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
    

    
  } else {
    console.log('Nenhum token encontrado no localStorage');
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});