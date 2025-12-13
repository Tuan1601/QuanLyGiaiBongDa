import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'https://fleague-tournament-system.onrender.com/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
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
    
    if (error.response?.status === 403) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      console.log('Access forbidden, clearing tokens');
      return Promise.reject(new Error('Access forbidden'));
    }
    
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