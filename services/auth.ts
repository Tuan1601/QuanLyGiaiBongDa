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
    return response.data;
  },

  // PATCH /user/change-password
  changePassword: async (data: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
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
};