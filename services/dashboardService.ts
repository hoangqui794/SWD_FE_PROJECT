
import apiClient from './apiClient';

export interface DashboardStats {
    message: string;
    total_sites: number;
    total_hubs: number;
    active_sensors: number;
    pending_alerts: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/api/dashboard/stats');
    return response.data;
};
