import apiClient from './apiClient';

export interface Organization {
    orgId: number;
    name: string;
    description: string;
    createdAt: string;
    siteCount: number;
}

export interface OrgQueryParams {
    search?: string;       // Tìm kiếm theo tên hoặc mô tả
    pageNumber?: number;
    pageSize?: number;
    sortBy?: 'name' | 'createdAt' | 'orgId'; // default: orgId
    sortOrder?: 'asc' | 'desc';               // default: asc
}

interface ApiResponse<T> {
    message: string;
    count: number;
    data: T;
}

export const organizationService = {
    getAll: async (params?: OrgQueryParams): Promise<Organization[]> => {
        const query: Record<string, any> = {};
        if (params?.search) query.search = params.search;
        if (params?.pageNumber !== undefined) query.pageNumber = params.pageNumber;
        if (params?.pageSize !== undefined) query.pageSize = params.pageSize;
        if (params?.sortBy) query.sortBy = params.sortBy;
        if (params?.sortOrder) query.sortOrder = params.sortOrder;

        const response = await apiClient.get<ApiResponse<Organization[]>>('/api/organizations', { params: query });
        return response.data.data;
    },

    getById: async (id: number): Promise<Organization> => {
        const response = await apiClient.get<ApiResponse<Organization>>(`/api/organizations/${id}`);
        return response.data.data;
    },

    create: async (data: Omit<Organization, 'orgId' | 'createdAt' | 'siteCount'>): Promise<void> => {
        await apiClient.post('/api/organizations', data);
    },

    update: async (id: number, data: Omit<Organization, 'orgId' | 'createdAt' | 'siteCount'>): Promise<void> => {
        await apiClient.put(`/api/organizations/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/organizations/${id}`);
    }
};
