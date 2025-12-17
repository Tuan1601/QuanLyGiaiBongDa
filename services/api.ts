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
      console.log('🔄 Got 401, attempting token refresh for URL:', originalRequest.url);
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.log('❌ No refresh token found');
          throw new Error('No refresh token');
        }

        console.log('🔄 Calling refresh token API...');
        const response = await axios.post(`${BASE_URL}/user/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
        
        // Calculate expiry timestamps
        const accessTokenExpiry = new Date();
        accessTokenExpiry.setMinutes(accessTokenExpiry.getMinutes() + 15); // 15 minutes (theo doc)
        
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days
        
        // Save tokens with expiry
        await AsyncStorage.multiSet([
          ['accessToken', accessToken],
          ['refreshToken', newRefreshToken],
          ['accessTokenExpiry', accessTokenExpiry.toISOString()],
          ['refreshTokenExpiry', refreshTokenExpiry.toISOString()],
        ]);
        
        console.log('✅ Token refreshed successfully with 7-day expiry');

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.log('❌ Token refresh failed:', refreshError);
        await AsyncStorage.multiRemove([
          'accessToken', 
          'refreshToken',
          'accessTokenExpiry',
          'refreshTokenExpiry',
        ]);
        console.log('🚪 Tokens cleared - user will be logged out');
        
        // Create a more descriptive error for the user
        const authError = new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        authError.name = 'AuthenticationError';
        return Promise.reject(authError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.log('❌ Got 403 Forbidden for URL:', originalRequest.url);
      console.log('403 Response data:', error.response?.data);
      await AsyncStorage.multiRemove([
        'accessToken', 
        'refreshToken',
        'accessTokenExpiry',
        'refreshTokenExpiry',
      ]);
      console.log('🚪 Tokens cleared due to 403');
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