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

export const siteService = {
    getAll: async (search?: string): Promise<Site[]> => {
        const params = search ? { search } : {};
        const response = await apiClient.get<Site[]>('/api/site', { params });
        return response.data;
    },

    create: async (data: Omit<Site, 'siteId' | 'orgName' | 'hubCount'>): Promise<void> => {
        await apiClient.post('/api/site', data);
    },

    // Future methods: update, delete
    // update: async (id: number, data: any) => apiClient.put(`/api/site/${id}`, data),
    // delete: async (id: number) => apiClient.delete(`/api/site/${id}`),
};
