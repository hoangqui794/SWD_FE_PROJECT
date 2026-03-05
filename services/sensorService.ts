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

// Interface query params theo Swagger spec
export interface SensorQueryParams {
    hub_id?: number;     // Lọc theo Hub ID
    type?: number;       // Lọc theo loại cảm biến (TypeId)
    search?: string;     // Tìm kiếm theo tên cảm biến
    status?: string;     // Lọc theo trạng thái (Active, Inactive...)
    pageNumber?: number;
    pageSize?: number;
    sortBy?: 'name' | 'status' | 'hubId' | 'type' | 'sensorId';
    sortOrder?: 'asc' | 'desc';
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
     * Lấy danh sách tất cả sensors với đầy đủ filter theo Swagger
     */
    getAll: async (params?: SensorQueryParams): Promise<Sensor[]> => {
        const query: Record<string, any> = {};
        if (params?.hub_id) query.hub_id = params.hub_id;
        if (params?.type) query.type = params.type;
        if (params?.search) query.search = params.search;
        if (params?.status) query.status = params.status;
        if (params?.pageNumber !== undefined) query.pageNumber = params.pageNumber;
        if (params?.pageSize !== undefined) query.pageSize = params.pageSize;
        if (params?.sortBy) query.sortBy = params.sortBy;
        if (params?.sortOrder) query.sortOrder = params.sortOrder;

        const response = await apiClient.get<ApiResponse<Sensor[]>>('/api/sensors', { params: query });
        return response.data.data;
    },

    /**
     * Tạo sensor mới
     */
    create: async (data: CreateSensorRequest): Promise<void> => {
        await apiClient.post('/api/sensors', data);
    },

    /**
     * Cập nhật thông tin sensor
     */
    update: async (id: number, data: Partial<CreateSensorRequest>): Promise<void> => {
        await apiClient.put(`/api/sensors/${id}`, data);
    },

    /**
     * Xóa sensor
     */
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/api/sensors/${id}`);
    },
};
