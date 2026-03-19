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
    priority: string;      // "High", "Medium", "Low"
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

export interface AlertRuleQueryParams {
    search?: string;       // Tìm kiếm theo tên quy tắc hoặc tên cảm biến
    isActive?: boolean;    // Lọc theo trạng thái active/inactive
    priority?: string;     // Lọc theo mức độ ưu tiên (High, Medium, Low...)
    pageNumber?: number;
    pageSize?: number;
    sortBy?: 'name' | 'priority' | 'isActive' | 'sensorId' | 'ruleId'; // default: ruleId
    sortOrder?: 'asc' | 'desc'; // default: asc
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
     */
    getAll: async (status?: string, search?: string): Promise<Alert[]> => {
        const params: any = {};
        if (status && status !== 'All') params.status = status;
        if (search) params.search = search;

        const response = await apiClient.get<ApiResponse<Alert[]>>('/api/alerts', { params });
        return response.data.data;
    },

    /**
     * Lấy danh sách các quy tắc cảnh báo (Alert Rules) với đầy đủ filter
     */
    getRules: async (params?: AlertRuleQueryParams): Promise<AlertRule[]> => {
        const query: Record<string, any> = {};
        if (params?.search) query.search = params.search;
        if (params?.isActive !== undefined) query.isActive = params.isActive;
        if (params?.priority && params.priority !== 'All') query.priority = params.priority;
        if (params?.pageNumber !== undefined) query.pageNumber = params.pageNumber;
        if (params?.pageSize !== undefined) query.pageSize = params.pageSize;
        if (params?.sortBy) query.sortBy = params.sortBy;
        if (params?.sortOrder) query.sortOrder = params.sortOrder;

        const response = await apiClient.get<ApiResponse<AlertRule[]>>('/api/alerts/rules', { params: query });
        return response.data.data;
    },

    /**
     * Lấy chi tiết một quy tắc cảnh báo qua ID
     */
    getRuleById: async (id: number): Promise<AlertRule> => {
        const response = await apiClient.get< { data: AlertRule } >(`/api/alerts/rules/${id}`);
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
     * Cập nhật quy tắc cảnh báo
     */
    updateRule: async (id: number, data: CreateAlertRuleRequest): Promise<any> => {
        const response = await apiClient.put(`/api/alerts/rules/${id}`, data);
        return response.data;
    },

    /**
     * Đánh dấu alert là đã resolved
     */
    resolve: async (id: number): Promise<{ message: string; resolvedAt: string }> => {
        const response = await apiClient.put(`/api/alerts/${id}/resolve`);
        return response.data;
    },

    /**
     * Xóa alert
     */
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/alerts/${id}`);
    },
};
