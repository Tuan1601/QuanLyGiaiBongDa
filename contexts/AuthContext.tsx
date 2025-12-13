import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth';

interface User {
    _id: string;
    username: string;
    email: string;
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
            
            // Clear invalid tokens on 401/403
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log('Token invalid, clearing auth data');
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
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