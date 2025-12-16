import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth';

interface User {
    _id: string;
    username: string;
    email: string;
    fullName?: string;
    phone?: string;
    avatar: string | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) {
                setLoading(false);
                return;
            }

            const userData = await authService.getProfile();
            setUser(userData);
        } catch (error: any) {
            console.error('Auth check failed:', error);
            
            // Check if it's a network error (no response from server)
            if (!error.response) {
                if (error.message === 'Network Error') {
                    console.log('Network error - no internet connection or server unreachable');
                } else if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
                    console.log('Auth check timeout - server may be slow');
                } else {
                    console.log('Auth check failed with unknown error:', error.message);
                }
                // Don't clear tokens for network errors - user might just be offline temporarily
            } else if (error.response?.status === 401 || error.response?.status === 403) {
                console.log('Token invalid, clearing auth data');
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
                setUser(null);
            } else if (error.message === 'Authentication failed') {
                // This comes from the interceptor when refresh token fails
                console.log('Authentication failed, tokens cleared by interceptor');
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            await authService.login({ email, password });
            const userData = await authService.getProfile();
            setUser(userData);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const register = async (username: string, email: string, password: string) => {
        await authService.register({ username, email, password });
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout API call failed:', error);
            // Continue with local logout even if API call fails
        } finally {
            // Always clear local state and tokens
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
            setUser(null);
            
            // Clear all React Query cache to prevent data leakage between users
            queryClient.clear();
        }
    };

    const updateUser = (userData: User) => {
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);