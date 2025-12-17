import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Token storage keys
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  ACCESS_TOKEN_EXPIRY: 'accessTokenExpiry',
  REFRESH_TOKEN_EXPIRY: 'refreshTokenExpiry',
};

// Token expiry durations
const TOKEN_EXPIRY = {
  ACCESS_TOKEN_MINUTES: 15, // Access token valid for 15 minutes (theo doc)
  REFRESH_TOKEN_DAYS: 7, // Refresh token valid for 7 days
};

// Helper to calculate expiry timestamp
const getExpiryTimestamp = (minutes?: number, days?: number): string => {
  const now = new Date();
  if (days) {
    now.setDate(now.getDate() + days);
  } else if (minutes) {
    now.setMinutes(now.getMinutes() + minutes);
  }
  return now.toISOString();
};

// Helper to check if token is expired or near expiry
const isTokenExpiring = (expiryTimeString: string | null, bufferMinutes = 5): boolean => {
  if (!expiryTimeString) return true;
  
  const expiryTime = new Date(expiryTimeString);
  const now = new Date();
  const bufferTime = new Date(now.getTime() + bufferMinutes * 60 * 1000);
  
  return bufferTime >= expiryTime;
};

export const authService = {
  // POST /user/register
  register: async (data: RegisterData) => {
    const response = await api.post('/user/register', data);
    return response.data;
  },

  // POST /user/login
  login: async (data: LoginData) => {
    const response = await api.post('/user/login', data);
    const { accessToken, refreshToken } = response.data;
    
    // Save tokens with expiry timestamps
    await AsyncStorage.multiSet([
      [TOKEN_KEYS.ACCESS_TOKEN, accessToken],
      [TOKEN_KEYS.REFRESH_TOKEN, refreshToken],
      [TOKEN_KEYS.ACCESS_TOKEN_EXPIRY, getExpiryTimestamp(TOKEN_EXPIRY.ACCESS_TOKEN_MINUTES)],
      [TOKEN_KEYS.REFRESH_TOKEN_EXPIRY, getExpiryTimestamp(undefined, TOKEN_EXPIRY.REFRESH_TOKEN_DAYS)],
    ]);
    
    console.log('✅ Tokens saved with 7-day refresh token expiry');
    
    return response.data;
  },

  // POST /user/logout
  logout: async () => {
    const refreshToken = await AsyncStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    await api.post('/user/logout', { refreshToken });
    await AsyncStorage.multiRemove([
      TOKEN_KEYS.ACCESS_TOKEN,
      TOKEN_KEYS.REFRESH_TOKEN,
      TOKEN_KEYS.ACCESS_TOKEN_EXPIRY,
      TOKEN_KEYS.REFRESH_TOKEN_EXPIRY,
    ]);
  },

  // POST /user/refresh - Refresh access token
  refreshToken: async () => {
    const refreshToken = await AsyncStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
    const refreshTokenExpiry = await AsyncStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN_EXPIRY);
    
    // Check if refresh token is expired
    if (isTokenExpiring(refreshTokenExpiry, 0)) {
      console.log('❌ Refresh token expired, clearing tokens');
      await AsyncStorage.multiRemove([
        TOKEN_KEYS.ACCESS_TOKEN,
        TOKEN_KEYS.REFRESH_TOKEN,
        TOKEN_KEYS.ACCESS_TOKEN_EXPIRY,
        TOKEN_KEYS.REFRESH_TOKEN_EXPIRY,
      ]);
      throw new Error('Refresh token expired');
    }
    
    const response = await api.post('/user/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
    
    // Update tokens with new expiry
    await AsyncStorage.multiSet([
      [TOKEN_KEYS.ACCESS_TOKEN, accessToken],
      [TOKEN_KEYS.REFRESH_TOKEN, newRefreshToken],
      [TOKEN_KEYS.ACCESS_TOKEN_EXPIRY, getExpiryTimestamp(TOKEN_EXPIRY.ACCESS_TOKEN_MINUTES)],
      [TOKEN_KEYS.REFRESH_TOKEN_EXPIRY, getExpiryTimestamp(undefined, TOKEN_EXPIRY.REFRESH_TOKEN_DAYS)],
    ]);
    
    console.log('✅ Tokens refreshed with new 7-day expiry');
    
    return response.data.tokens;
  },

  // Check if access token needs refresh (proactive refresh)
  shouldRefreshToken: async (): Promise<boolean> => {
    const accessTokenExpiry = await AsyncStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN_EXPIRY);
    return isTokenExpiring(accessTokenExpiry, 5); // Refresh 5 minutes before expiry
  },

  // Get token expiry info for debugging
  getTokenExpiryInfo: async () => {
    const [accessExpiry, refreshExpiry] = await AsyncStorage.multiGet([
      TOKEN_KEYS.ACCESS_TOKEN_EXPIRY,
      TOKEN_KEYS.REFRESH_TOKEN_EXPIRY,
    ]);
    
    return {
      accessTokenExpiry: accessExpiry[1],
      refreshTokenExpiry: refreshExpiry[1],
      accessTokenExpired: isTokenExpiring(accessExpiry[1], 0),
      refreshTokenExpired: isTokenExpiring(refreshExpiry[1], 0),
    };
  },

  // GET /user/profile
  getProfile: async () => {
    // Proactively refresh token if needed
    if (await authService.shouldRefreshToken()) {
      console.log('🔄 Proactively refreshing token before it expires');
      try {
        await authService.refreshToken();
      } catch (error) {
        console.log('⚠️ Proactive refresh failed, will retry on 401');
      }
    }
    
    const response = await api.get('/user/profile');
    return response.data.infoUser;
  },

  // PATCH /user/update-profile
  updateProfile: async (data: FormData | { username?: string; address?: string; phone?: string; avatar?: string }) => {
    const response = await api.patch('/user/update-profile', data);
    return {
      user: response.data.infoUser || response.data.user,
      message: response.data.message
    };
  },

  // PUT /user/change-password
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await api.patch('/user/change-password', data);
    return response.data;
  },

  // DELETE /user/delete-account
  deleteAccount: async (password: string) => {
    const response = await api.delete('/user/delete-account', {
      data: { password },
    });
    return response.data;
  },

  // POST /auth/forgot-password - Send OTP to email
  sendOTP: async (email: string) => {
    const response = await api.post('/user/forgot-password', { email });
    return response.data;
  },

  // POST /auth/verify-otp - Verify OTP and get resetToken
  verifyOTP: async (email: string, otp: string) => {
    const response = await api.post('/user/verify-otp', { email, otp });
    return response.data;
  },

  // POST /auth/reset-password - Reset password with resetToken
  resetPassword: async (email: string, resetToken: string, newPassword: string) => {
    const response = await api.post('/user/reset-password', { 
      email, 
      resetToken, 
      newPassword 
    });
    return response.data;
  },
};