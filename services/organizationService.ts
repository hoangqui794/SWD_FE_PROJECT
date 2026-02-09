import apiClient from './apiClient';

export interface Organization {
    orgId: number;
    name: string;
    description: string;
    createdAt: string;
    siteCount: number;
}

interface ApiResponse<T> {
    message: string;
    count: number;
    data: T;
}

export const organizationService = {
    getAll: async (): Promise<Organization[]> => {
        const response = await apiClient.get<ApiResponse<Organization[]>>('/api/organizations');
        return response.data.data;
    },

    getById: async (id: number): Promise<Organization> => {
        const response = await apiClient.get<ApiResponse<Organization>>(`/api/organizations/${id}`);
        return response.data.data;
    }
};
