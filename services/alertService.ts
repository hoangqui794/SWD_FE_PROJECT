import apiClient from './apiClient';

// Interface định nghĩa cấu trúc dữ liệu Alert từ API
export interface Alert {
    id: number;
    time: string;              // ISO datetime string
    sensor_name: string;       // Tên sensor
    severity: string;          // "Critical" hoặc "Warning"
    status: string;            // "Active" hoặc "Resolved"
}

export interface AlertRule {
    ruleId: number;
    sensorId: number;
    sensorName: string;
    name: string;
    conditionType: string; // "MinMax", etc.
    minVal: number;
    maxVal: number;
    notificationMethod: string; // "Email", etc.
    priority: string;      // "Critical", etc.
    isActive: boolean;
}

export interface CreateAlertRuleRequest {
    sensorId: number;
    name: string;
    conditionType: string;
    minVal: number;
    maxVal: number;
    notificationMethod: string;
    priority: string;
}

// Interface cho API response
interface ApiResponse<T> {
    message: string;
    count: number;
    data: T;
}

// Service chứa các hàm gọi API
export const alertService = {
    /**
     * Lấy tất cả alerts (có filter và search)
     * @param status - Trạng thái alert ("Active", "Resolved", hoặc null cho tất cả)
     * @param search - Từ khóa tìm kiếm theo tên sensor
     */
    getAll: async (status?: string, search?: string): Promise<Alert[]> => {
        const params: any = {};
        if (status && status !== 'All') params.status = status;
        if (search) params.search = search;

        const response = await apiClient.get<ApiResponse<Alert[]>>('/api/alerts', { params });
        return response.data.data;
    },

    /**
     * Lấy danh sách các quy tắc cảnh báo (Alert Rules)
     */
    getRules: async (): Promise<AlertRule[]> => {
        const response = await apiClient.get<ApiResponse<AlertRule[]>>('/api/alerts/rules');
        return response.data.data;
    },

    /**
     * Tạo quy tắc cảnh báo mới
     */
    createRule: async (data: CreateAlertRuleRequest): Promise<any> => {
        const response = await apiClient.post('/api/alerts/rules', data);
        return response.data;
    },

    /**
     * Đánh dấu alert là đã resolved
     * @param id - ID của alert
     */
    resolve: async (id: number): Promise<{ message: string; resolvedAt: string }> => {
        const response = await apiClient.put(`/api/alerts/${id}/resolve`);
        return response.data;
    },

    /**
     * Xóa alert
     * @param id - ID của alert
     */
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/alerts/${id}`);
    },
};
