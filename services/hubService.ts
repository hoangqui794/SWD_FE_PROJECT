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

// Interface cho realtime data (current-temperature)
export interface HubEnvironmentSensor {
    sensorId: number;
    sensorName: string;
    typeName: string;
    currentValue: number;
    unit: string;
    lastUpdate: string;
    status: string;
}

export interface HubEnvironmentResponse {
    message: string;
    hubId: number;
    hubName: string;
    sensorCount: number;
    data: HubEnvironmentSensor[];
}

// Interface cho historical data (readings)
export interface HubReading {
    recordedAt: string;
    value: number;
}

export interface HubSensorReadings {
    sensorId: number;
    name: string;
    typeName: string;
    unit: string;
    readings: HubReading[];
}

export interface HubHistoricalData {
    hubId: number;
    name: string;
    macAddress: string;
    sensors: HubSensorReadings[];
}

export interface HubQueryParams {
    site_id?: number;
    search?: string;
    isOnline?: boolean;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: 'name' | 'macAddress' | 'isOnline' | 'lastHandshake' | 'hubId';
    sortOrder?: 'asc' | 'desc';
}

interface ApiResponse<T> {
    message: string;
    count?: number;
    totalCount?: number;
    data: T;
}

export const hubService = {
    getAll: async (params?: HubQueryParams): Promise<Hub[]> => {
        const query: Record<string, any> = {};
        if (params?.site_id) query.site_id = params.site_id;
        if (params?.search) query.search = params.search;
        if (params?.isOnline !== undefined) query.isOnline = params.isOnline;
        if (params?.pageNumber !== undefined) query.pageNumber = params.pageNumber;
        if (params?.pageSize !== undefined) query.pageSize = params.pageSize;
        if (params?.sortBy) query.sortBy = params.sortBy;
        if (params?.sortOrder) query.sortOrder = params.sortOrder;

        const response = await apiClient.get<ApiResponse<Hub[]>>('/api/hubs', { params: query });
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

    /**
     * Lấy thông tin chi tiết một Hub theo ID (Dùng cho cả Site Hub filtering)
     */
    getById: async (id: number): Promise<Hub> => {
        const response = await apiClient.get<{ data: Hub }>(`/api/hubs/${id}`);
        return response.data.data;
    },

    getReadings: async (hubId: number, from?: string, to?: string): Promise<HubHistoricalData> => {
        const params: any = {};
        if (from) params.from = from;
        if (to) params.to = to;
        const response = await apiClient.get<ApiResponse<HubHistoricalData>>(`/api/hubs/${hubId}/readings`, { params });
        return response.data.data;
    },

    getCurrentTemperature: async (hubId: number): Promise<HubEnvironmentResponse> => {
        const response = await apiClient.get<HubEnvironmentResponse>(`/api/hubs/${hubId}/current-temperature`);
        return response.data;
    },

    getCurrentEnvironment: async (hubId: number): Promise<HubHistoricalData> => {
        const response = await apiClient.get<ApiResponse<HubHistoricalData>>(`/api/dashboard/hub/${hubId}/current-environment`);
        return response.data.data;
    },
};
