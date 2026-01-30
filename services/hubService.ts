import apiClient from './apiClient';

export interface Hub {
    hubId: number;
    siteId: number;
    siteName: string;
    name: string;
    macAddress: string;
    isOnline: boolean;
    lastHandshake: string;
    sensorCount: number;
}

interface ApiResponse<T> {
    message: string;
    count: number;
    data: T;
}

export const hubService = {
    getAll: async (siteId?: string): Promise<Hub[]> => {
        const params = siteId ? { site_id: siteId } : {};
        const response = await apiClient.get<ApiResponse<Hub[]>>('/api/hubs', { params });
        return response.data.data;
    },

    create: async (data: { siteId: number; name: string; macAddress: string }): Promise<void> => {
        await apiClient.post('/api/hubs', data);
    },

    update: async (id: number, data: { siteId: number; name: string; macAddress: string }): Promise<void> => {
        await apiClient.put(`/api/hubs/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/hubs/${id}`);
    },
};
