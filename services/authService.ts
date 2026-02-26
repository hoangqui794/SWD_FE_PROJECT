import apiClient from './apiClient';
import { LoginCredentials, RegisterCredentials, User, AuthResponse } from '../types/auth';

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
        return response.data;
    },

    register: async (data: any): Promise<void> => {
        // data type matches the payload structure (orgId, siteId, fullName...)
        await apiClient.post('/api/auth/register', data);
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await apiClient.get<User>('/api/auth/me');
        return response.data;
    },

    changePassword: async (data: any): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>('/api/auth/change-password', data);
        return response.data;
    }
};
