import axios from 'axios';
import { getAccessToken } from './auth/cognito';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, '') || '',
});

// Attach Authorization header if logged in
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
