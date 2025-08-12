import axios from 'axios';
import { getBearerToken } from './auth/cognito';

const api = axios.create({
  baseURL: (process.env.REACT_APP_API_BASE_URL || '').replace(/\/+$/, ''),
});

api.interceptors.request.use((config) => {
  const token = getBearerToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
