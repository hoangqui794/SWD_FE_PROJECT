
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

export interface UserQueryParams {
    search?: string;       // Tìm kiếm theo tên hoặc email
    isActive?: boolean;    // Lọc theo trạng thái active/inactive
    pageNumber?: number;
    pageSize?: number;
    sortBy?: 'fullName' | 'email' | 'isActive' | 'roleId' | 'userId'; // default: userId
    sortOrder?: 'asc' | 'desc'; // default: asc
}

export const userService = {
    getAll: async (params?: UserQueryParams): Promise<User[]> => {
        const query: Record<string, any> = {};
        if (params?.search) query.search = params.search;
        if (params?.isActive !== undefined) query.isActive = params.isActive;
        if (params?.pageNumber !== undefined) query.pageNumber = params.pageNumber;
        if (params?.pageSize !== undefined) query.pageSize = params.pageSize;
        if (params?.sortBy) query.sortBy = params.sortBy;
        if (params?.sortOrder) query.sortOrder = params.sortOrder;

        const response = await apiClient.get<{ message: string; count: number; data: User[] }>('/api/users', { params: query });
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
