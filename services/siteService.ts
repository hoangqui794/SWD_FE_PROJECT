import apiClient from './apiClient';

export interface Site {
    siteId: number;
    orgId: number;
    orgName: string;
    name: string;
    address: string;
    geoLocation: string;
    hubCount: number;
}

interface ApiResponse<T> {
    message: string;
    count: number;
    data: T;
}

export const siteService = {
    getAll: async (search?: string): Promise<Site[]> => {
        const params = search ? { search } : {};
        const response = await apiClient.get<ApiResponse<Site[]>>('/api/site', { params });
        return response.data.data;
    },

    create: async (data: Omit<Site, 'siteId' | 'orgName' | 'hubCount'>): Promise<void> => {
        await apiClient.post('/api/site', data);
    },

    update: async (id: number, data: Omit<Site, 'siteId' | 'orgName' | 'hubCount'>): Promise<void> => {
        await apiClient.put(`/api/site/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/site/${id}`);
    },
};
