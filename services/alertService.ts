import apiClient from './apiClient';

// Interface định nghĩa cấu trúc dữ liệu Alert từ API
export interface Alert {
    id: number;
    time: string;              // ISO datetime string
    sensor_name: string;       // Tên sensor
    severity: string;          // "Critical" hoặc "Warning"
    status: string;            // "Active" hoặc "Resolved"
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
     * Lấy danh sách alerts
     * @param status - Filter theo status: "All", "Active", "Resolved"
     * @param search - Tìm kiếm theo tên sensor
     * @returns Promise chứa mảng Alert[]
     */
    getAll: async (status?: string, search?: string): Promise<Alert[]> => {
        const params: any = {};
        if (status) params.status = status;
        if (search) params.search = search;

        const response = await apiClient.get<ApiResponse<Alert[]>>('/api/alerts', { params });
        return response.data.data;
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
