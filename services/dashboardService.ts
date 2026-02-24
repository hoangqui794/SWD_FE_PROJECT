
import apiClient from './apiClient';

export interface DashboardStats {
    message: string;
    total_sites: number;
    total_hubs: number;
    active_sensors: number;
    pending_alerts: number;
}

export interface RecentAlert {
    id: number;
    sensorName: string;
    location: string;
    value: number;
    metricUnit: string;
    severity: string;
    status: string;
    time: string;
}

interface RecentAlertsResponse {
    data: RecentAlert[];
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/api/dashboard/stats');
    return response.data;
};

export const getRecentAlerts = async (limit: number = 5): Promise<RecentAlert[]> => {
    const response = await apiClient.get<RecentAlertsResponse>('/api/dashboard/alerts', {
        params: { limit }
    });
    return response.data.data;
};
