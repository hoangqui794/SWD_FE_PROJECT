
import apiClient from './apiClient';

export interface User {
    userId: number;
    email: string;
    fullName: string;
    roleId: number;
    roleName: string;
    orgId: number;
    siteId: number | null;
    siteName: string | null;
    isActive: boolean;
}

export interface CreateUserRequest {
    orgId: number;
    siteId: number;
    fullName: string;
    email: string;
    roleId: number;
}

export interface UpdateUserRequest {
    fullName: string;
    siteId: number | null;
}

export const userService = {
    getAll: async (): Promise<User[]> => {
        const response = await apiClient.get<{ message: string; count: number; data: User[] }>('/api/users');
        return response.data.data;
    },

    create: async (data: CreateUserRequest): Promise<void> => {
        await apiClient.post('/api/users', data);
    },

    update: async (id: number, data: UpdateUserRequest): Promise<void> => {
        await apiClient.put(`/api/users/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/users/${id}`);
    },

    activate: async (id: number): Promise<any> => {
        const response = await apiClient.put(`/api/users/${id}/activate`, {});
        return response.data;
    },

    deactivate: async (id: number): Promise<any> => {
        const response = await apiClient.put(`/api/users/${id}/deactivate`, {});
        return response.data;
    }
};
