// lib/api/apiClient.ts

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

let authTokenGetter: (() => Promise<string | null>) | null = null;

/**
 * Register the token getter function (called from AuthProvider)
 */
export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  authTokenGetter = getter;
};

/**
 * Axios instance with JWT injection
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor: Inject JWT into Authorization header
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (authTokenGetter) {
      const token = await authTokenGetter();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor: Handle 401 errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - trigger logout or refresh
      // You can emit an event here or redirect to login
      console.error('Unauthorized - token may be expired');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
