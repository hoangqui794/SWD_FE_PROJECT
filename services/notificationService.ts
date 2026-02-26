import apiClient from './apiClient';

export interface NotificationHistoryItem {
    id: number;
    ruleId: number;
    userId: number;
    message: string;
    sensorName: string;
    location: string;
    value: number;
    metricUnit: string;
    severity: string;
    status: string;
    time: string;
    isRead: boolean;
    sensorId: number;
}

export interface NotificationHistoryResponse {
    message: string;
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    data: NotificationHistoryItem[];
}

export interface NotificationHistoryParams {
    userId?: number;
    siteId?: number;
    sensorId?: number;
    severity?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
}

export const notificationService = {
    getHistory: async (params: NotificationHistoryParams): Promise<NotificationHistoryResponse> => {
        const response = await apiClient.get<NotificationHistoryResponse>('/api/notifications/history', { params });
        return response.data;
    },

    markAsRead: async (id: number): Promise<any> => {
        const response = await apiClient.put(`/api/notifications/${id}/read`);
        return response.data;
    }
};
