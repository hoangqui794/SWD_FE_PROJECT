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

    // Future methods: create, update, delete
    // create: async (data: any) => apiClient.post('/api/site', data),
    // update: async (id: number, data: any) => apiClient.put(`/api/site/${id}`, data),
    // delete: async (id: number) => apiClient.delete(`/api/site/${id}`),
};
