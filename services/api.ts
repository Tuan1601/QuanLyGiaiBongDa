import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { hideOfflineBanner, showOfflineBanner } from '../components/ui/offline-indicator';

const BASE_URL = 'https://fleague-tournament-system.onrender.com/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // Tăng timeout lên 30s
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Auto-detect Content-Type based on data
    // FormData in React Native needs explicit Content-Type
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else if (config.data && typeof config.data === 'object') {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // Connection successful - hide offline banner if showing
    hideOfflineBanner();
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors (no response from server)
    if (!error.response) {
      console.error('API Error:', {
        message: error.message,
        url: error.config?.url,
        code: error.code,
        isTimeout: error.code === 'ECONNABORTED' || error.message?.includes('timeout'),
        isNetworkError: error.message === 'Network Error',
      });

      if (error.message === 'Network Error') {
        console.warn('Network Error - No internet connection or server unreachable');
        showOfflineBanner(); // Show offline indicator
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('Request timeout - server may be slow or unavailable');
        showOfflineBanner(); // Show offline indicator
      }

      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${BASE_URL}/user/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        console.log('Refresh failed, user logged out');
        return Promise.reject(new Error('Authentication failed'));
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      console.log('Access forbidden, clearing tokens');
      return Promise.reject(new Error('Access forbidden'));
    }

    // Log other API errors for debugging
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

export default api;