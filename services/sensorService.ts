import apiClient from './apiClient';

// Interface định nghĩa cấu trúc dữ liệu của Sensor (khớp với API response)
export interface Sensor {
    sensorId: number;          // ID của sensor
    hubId: number;             // ID của hub
    hubName: string;           // Tên hub (VD: "EOH-Hub-HCMC-ThuDuc")
    typeId: number;            // ID của loại sensor (1: Temperature, 2: Humidity, 3: Pressure)
    typeName: string;          // Tên loại sensor
    sensorName: string;        // Tên sensor (VD: "Temp-Sensor-01")
    currentValue: number;      // Giá trị hiện tại
    lastUpdate: string | null; // Thời gian cập nhật cuối (ISO format)
    status: string;            // Trạng thái: "Online", "Offline", "Warning"
}

// Interface cho việc tạo sensor mới
export interface CreateSensorRequest {
    name: string;      // Tên sensor
    typeId: number;    // ID loại sensor (1: Temperature, 2: Humidity, 3: Pressure)
    hubId: number;     // ID của hub
}

// Interface cho API response
interface ApiResponse<T> {
    message: string;
    count: number;
    userSiteId: number | null;
    data: T;
}

// Service chứa các hàm gọi API
export const sensorService = {
    /**
     * Lấy danh sách tất cả sensors
     * @param hubId - Optional: Lọc theo Hub ID
     * @param typeId - Optional: Lọc theo loại sensor (1: Temperature, 2: Humidity, 3: Pressure)
     * @returns Promise chứa mảng Sensor[]
     */
    getAll: async (hubId?: number, typeId?: number, siteId?: number): Promise<Sensor[]> => {
        const params: any = {};
        // API backend sử dụng snake_case cho parameters
        if (hubId) params.hub_id = hubId;
        if (typeId) params.type = typeId;
        if (siteId) params.site_id = siteId;

        const response = await apiClient.get<ApiResponse<Sensor[]>>('/api/sensors', { params });
        return response.data.data;
    },

    /**
     * Tạo sensor mới
     * @param data - Dữ liệu sensor cần tạo
     */
    create: async (data: CreateSensorRequest): Promise<void> => {
        await apiClient.post('/api/sensors', data);
    },

    /**
     * Cập nhật thông tin sensor
     * @param id - ID của sensor cần cập nhật
     * @param data - Dữ liệu mới
     */
    update: async (id: number, data: Partial<CreateSensorRequest>): Promise<void> => {
        await apiClient.put(`/api/sensors/${id}`, data);
    },

    /**
     * Xóa sensor
     * @param id - ID của sensor cần xóa
     */
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/sensors/${id}`);
    },
};
