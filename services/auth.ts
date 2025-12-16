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
    
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    
    return response.data;
  },

  // POST /user/logout
  logout: async () => {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    await api.post('/user/logout', { refreshToken });
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
  },

  // POST /user/refresh
  refreshToken: async () => {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const response = await api.post('/user/refresh', { refreshToken });
    return response.data.tokens;
  },

  // GET /user/profile
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data.infoUser;
  },

  // PATCH /user/update-profile
  updateProfile: async (formData: FormData) => {
    const response = await api.patch('/user/update-profile', formData);
    // API returns: { message: "...", infoUser: {...} } or { message: "...", user: {...} }
    // Need to return the user object, not the whole response
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
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // POST /auth/verify-otp - Verify OTP and get resetToken
  verifyOTP: async (email: string, otp: string) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  // POST /auth/reset-password - Reset password with resetToken
  resetPassword: async (email: string, resetToken: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { 
      email, 
      resetToken, 
      newPassword 
    });
    return response.data;
  },
};