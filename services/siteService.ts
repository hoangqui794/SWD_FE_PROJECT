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

export interface SiteQueryParams {
    search?: string;      // Tìm kiếm theo tên hoặc ID
    orgId?: number;       // Lọc theo tổ chức (OrgId)
    pageNumber?: number;
    pageSize?: number;
    sortBy?: 'name' | 'address' | 'orgId' | 'siteId';  // default: siteId
    sortOrder?: 'asc' | 'desc';                          // default: asc
}

interface ApiResponse<T> {
    message: string;
    count: number;
    data: T;
}

export const siteService = {
    getAll: async (params?: SiteQueryParams): Promise<Site[]> => {
        const query: Record<string, any> = {};
        if (params?.search) query.search = params.search;
        if (params?.orgId !== undefined) query.orgId = params.orgId;
        if (params?.pageNumber !== undefined) query.pageNumber = params.pageNumber;
        if (params?.pageSize !== undefined) query.pageSize = params.pageSize;
        if (params?.sortBy) query.sortBy = params.sortBy;
        if (params?.sortOrder) query.sortOrder = params.sortOrder;

        const response = await apiClient.get<ApiResponse<Site[]>>('/api/site', { params: query });
        return response.data.data;
    },

    getById: async (id: number): Promise<Site> => {
        const response = await apiClient.get<{ message: string; data: Site }>(`/api/site/${id}`);
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
