# 📡 Giải Thích Chi Tiết: Tích Hợp API GET Sensors Vào Giao Diện

## 🎯 Tổng Quan

API GET sensors được tích hợp vào giao diện React thông qua một kiến trúc 3 lớp:
1. **API Client Layer** - Xử lý HTTP requests và authentication
2. **Service Layer** - Quản lý business logic và API calls
3. **Component Layer** - Hiển thị dữ liệu và tương tác với người dùng

---

## 📂 Cấu Trúc File

```
SWD_FE_PROJECT/
├── services/
│   ├── apiClient.ts          # HTTP client với axios
│   └── sensorService.ts      # Service cho sensors API
├── pages/
│   └── SensorsPage.tsx       # Component hiển thị sensors
└── .env                      # Cấu hình API URL
```

---

## 🔧 Chi Tiết Từng Lớp

### 1️⃣ **API Client Layer** (`apiClient.ts`)

**Chức năng:**
- Tạo axios instance với base URL từ environment variable
- Tự động thêm JWT token vào mọi request
- Xử lý lỗi 401 (unauthorized) và redirect về login

**Code quan trọng:**
```typescript
const apiClient = axios.create({
    baseURL: API_BASE_URL,  // Từ .env: https://swd-project-api.onrender.com
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor tự động thêm token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

**Luồng hoạt động:**
```
User Request → apiClient → Add Token → Send to API → Return Response
```

---

### 2️⃣ **Service Layer** (`sensorService.ts`)

**Chức năng:**
- Định nghĩa TypeScript interfaces cho Sensor data
- Cung cấp các hàm CRUD (Create, Read, Update, Delete)
- Xử lý response từ API và trả về dữ liệu đã format

**Interface Sensor:**
```typescript
export interface Sensor {
    sensorId: number;        // ID duy nhất của sensor
    hubId: number;           // ID của hub mà sensor thuộc về
    hubName: string;         // Tên hub (từ API)
    name: string;            // Tên sensor
    type: string;            // Loại: Temperature, Humidity, Pressure
    unit: string;            // Đơn vị: °C, %, hPa
    minValue: number;        // Giá trị min
    maxValue: number;        // Giá trị max
    status: string;          // Active, Offline, Warning
    lastValue?: number;      // Giá trị đo gần nhất
    lastUpdated?: string;    // Thời gian cập nhật cuối
}
```

**Hàm getAll() - Lấy danh sách sensors:**
```typescript
getAll: async (hubId?: number, type?: string): Promise<Sensor[]> => {
    // 1. Chuẩn bị query parameters
    const params: any = {};
    if (hubId) params.hubId = hubId;
    if (type) params.type = type;
    
    // 2. Gọi API với axios
    const response = await apiClient.get<ApiResponse<Sensor[]>>(
        '/api/sensors', 
        { params }
    );
    
    // 3. Trả về data từ response
    return response.data.data;
}
```

**API Request thực tế:**
```bash
GET https://swd-project-api.onrender.com/api/sensors?type=Temperature
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
```

**API Response:**
```json
{
  "message": "Lấy danh sách sensors thành công",
  "count": 3,
  "data": [
    {
      "sensorId": 1,
      "hubId": 1,
      "hubName": "HUB-001",
      "name": "Storage Temp",
      "type": "Temperature",
      "unit": "°C",
      "minValue": -10,
      "maxValue": 50,
      "status": "Active",
      "lastValue": 22.4,
      "lastUpdated": "2026-02-03T08:00:00Z"
    }
  ]
}
```

---

### 3️⃣ **Component Layer** (`SensorsPage.tsx`)

**Chức năng:**
- Quản lý state (loading, error, data)
- Gọi API khi component mount
- Hiển thị UI với loading/error states
- Cung cấp filter và refresh functionality

**State Management:**
```typescript
const [sensors, setSensors] = useState<Sensor[]>([]);     // Dữ liệu sensors
const [isLoading, setIsLoading] = useState(true);         // Trạng thái loading
const [error, setError] = useState<string | null>(null);  // Lỗi nếu có
const [filterType, setFilterType] = useState<string>(''); // Filter theo type
```

**useEffect Hook - Tự động fetch data:**
```typescript
useEffect(() => {
    fetchSensors();  // Gọi API khi component mount
}, [filterType, filterHubId]);  // Re-fetch khi filter thay đổi
```

**Hàm fetchSensors() - Gọi API:**
```typescript
const fetchSensors = async () => {
    setIsLoading(true);      // Bật loading
    setError(null);          // Clear error cũ
    
    try {
        // Gọi service để lấy data
        const data = await sensorService.getAll(filterHubId, filterType);
        setSensors(data);    // Lưu vào state
    } catch (error) {
        console.error("Failed to fetch sensors", error);
        setError('Không thể tải dữ liệu sensors...');
    } finally {
        setIsLoading(false); // Tắt loading
    }
};
```

**Luồng UI Rendering:**
```
1. Component mount → useEffect chạy
2. fetchSensors() được gọi
3. isLoading = true → Hiển thị loading spinner
4. API call thành công → setSensors(data)
5. isLoading = false → Hiển thị table với data
```

**Conditional Rendering:**
```typescript
{isLoading ? (
    // Hiển thị loading spinner
    <div className="animate-spin...">Đang tải...</div>
) : error ? (
    // Hiển thị error message
    <div className="text-red-500">{error}</div>
) : (
    // Hiển thị table với data
    <table>
        {sensors.map(sensor => (
            <tr key={sensor.sensorId}>
                <td>{sensor.name}</td>
                <td>{sensor.type}</td>
                <td>{sensor.lastValue} {sensor.unit}</td>
            </tr>
        ))}
    </table>
)}
```

---

## 🔄 Luồng Hoạt Động Hoàn Chỉnh

```
┌─────────────────┐
│  User mở page   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  SensorsPage.tsx        │
│  - useEffect() chạy     │
│  - fetchSensors() gọi   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  sensorService.ts       │
│  - getAll() được gọi    │
│  - Chuẩn bị params      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  apiClient.ts           │
│  - Thêm Bearer token    │
│  - Gửi GET request      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Backend API            │
│  GET /api/sensors       │
│  - Xác thực token       │
│  - Query database       │
│  - Trả về JSON          │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Response về frontend   │
│  {message, count, data} │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  sensorService.ts       │
│  - Extract data         │
│  - Return Sensor[]      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  SensorsPage.tsx        │
│  - setSensors(data)     │
│  - Re-render UI         │
│  - Hiển thị table       │
└─────────────────────────┘
```

---

## 🎨 Features Đã Implement

### ✅ **Loading State**
- Hiển thị spinner khi đang fetch data
- Ngăn user tương tác khi chưa có data

### ✅ **Error Handling**
- Catch và hiển thị lỗi nếu API fail
- Nút "Thử lại" để retry

### ✅ **Filter Functionality**
- Filter theo type (Temperature, Humidity, Pressure)
- Auto re-fetch khi filter thay đổi

### ✅ **Refresh Button**
- Manual refresh data
- Useful cho real-time monitoring

### ✅ **Data Formatting**
- Format giá trị với đơn vị (22.4 °C)
- Format thời gian theo locale Việt Nam
- Color coding theo status

---

## 🔐 Authentication Flow

```
1. User login → Nhận JWT token
2. Token lưu vào localStorage
3. Mọi API request tự động thêm:
   Authorization: Bearer <token>
4. Backend verify token
5. Nếu token hết hạn → 401 error
6. apiClient tự động redirect về login
```

---

## 📊 Ví Dụ Thực Tế

**Khi user mở trang Sensors:**

1. **Component mount:**
   ```typescript
   useEffect(() => fetchSensors(), []);
   ```

2. **API call:**
   ```
   GET https://swd-project-api.onrender.com/api/sensors
   Authorization: Bearer eyJhbGc...
   ```

3. **Response nhận được:**
   ```json
   {
     "message": "Success",
     "count": 5,
     "data": [
       {
         "sensorId": 1,
         "name": "Storage Temp",
         "type": "Temperature",
         "lastValue": 22.4,
         "unit": "°C",
         "status": "Active"
       }
     ]
   }
   ```

4. **UI hiển thị:**
   ```
   ┌─────────────────────────────────────────┐
   │ Sensor ID │ Name         │ Value  │ ... │
   ├─────────────────────────────────────────┤
   │ 1         │ Storage Temp │ 22.4°C │ ... │
   └─────────────────────────────────────────┘
   ```

---

## 🚀 Cách Test

1. **Mở browser console** (F12)
2. **Navigate to Sensors page**
3. **Xem Network tab:**
   - Request URL: `/api/sensors`
   - Method: GET
   - Headers: Authorization có token
   - Response: JSON data

4. **Xem Console tab:**
   - Logs từ `console.log()` trong code
   - Errors nếu có

---

## 💡 Tips & Best Practices

1. **Luôn dùng TypeScript interfaces** cho type safety
2. **Handle loading và error states** cho UX tốt
3. **Sử dụng useEffect dependencies** đúng cách
4. **Centralize API calls** trong service layer
5. **Tách biệt concerns:** UI ≠ Business Logic ≠ API calls

---

## 🔧 Troubleshooting

**Lỗi thường gặp:**

1. **401 Unauthorized:**
   - Token hết hạn hoặc không hợp lệ
   - Solution: Login lại

2. **Network Error:**
   - Backend không chạy
   - CORS issues
   - Solution: Kiểm tra API URL trong `.env`

3. **Empty data:**
   - Database không có data
   - Filter quá strict
   - Solution: Kiểm tra backend logs

---

## 📝 Tóm Tắt

**API GET sensors được tích hợp qua:**
1. ✅ `apiClient.ts` - HTTP client với auto token
2. ✅ `sensorService.ts` - Service layer với typed functions
3. ✅ `SensorsPage.tsx` - UI component với state management
4. ✅ Loading/Error states cho UX tốt
5. ✅ Filter và refresh functionality

**Kết quả:** Một trang Sensors hoàn chỉnh, real-time, với error handling và UX tốt! 🎉
