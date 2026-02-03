# ✅ API Sensors Integration - Hoàn Thành

## 🎯 Tổng Quan
Đã tích hợp thành công API GET sensors từ backend vào giao diện React với cấu trúc dữ liệu chính xác.

---

## 📡 API Endpoint

**URL:** `GET https://swd-project-api.onrender.com/api/sensors`

**Query Parameters:**
- `hub_id` (number, optional) - Lọc theo Hub ID
- `type` (number, optional) - Lọc theo loại sensor
  - `1` = Temperature
  - `2` = Humidity  
  - `3` = Pressure

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Accept: */*
```

---

## 📊 API Response Structure

```json
{
  "message": "Lấy danh sách cảm biến thành công",
  "count": 3,
  "data": [
    {
      "sensorId": 1,
      "hubId": 1,
      "hubName": "EOH-Hub-HCMC-ThuDuc",
      "typeId": 1,
      "typeName": "Temperature",
      "sensorName": "Temp-Sensor-01",
      "currentValue": 27.17,
      "lastUpdate": "2026-02-03T07:42:01.422",
      "status": "Offline"
    }
  ]
}
```

---

## 🔧 Files Updated

### 1. `services/sensorService.ts`
**Thay đổi:**
- ✅ Cập nhật `Sensor` interface để khớp với API response
- ✅ Thêm `CreateSensorRequest` interface
- ✅ Đổi parameters từ `hubId` → `hub_id` (snake_case)
- ✅ Đổi `type` từ string → `typeId` (number)

**Interface mới:**
```typescript
export interface Sensor {
    sensorId: number;
    hubId: number;
    hubName: string;
    typeId: number;
    typeName: string;        // "Temperature", "Humidity", "Pressure"
    sensorName: string;
    currentValue: number;
    lastUpdate: string;      // ISO datetime
    status: string;          // "Online", "Offline", "Warning"
}
```

**API Call:**
```typescript
getAll: async (hubId?: number, typeId?: number): Promise<Sensor[]> => {
    const params: any = {};
    if (hubId) params.hub_id = hubId;    // ⚠️ snake_case
    if (typeId) params.type = typeId;    // ⚠️ typeId là number
    
    const response = await apiClient.get<ApiResponse<Sensor[]>>('/api/sensors', { params });
    return response.data.data;
}
```

---

### 2. `pages/SensorsPage.tsx`
**Thay đổi:**
- ✅ Đổi `filterType` (string) → `filterTypeId` (number)
- ✅ Cập nhật `formatSensorValue()` để dùng `currentValue` và `typeName`
- ✅ Cập nhật `getStatusColor()` để nhận diện "Online" thay vì "Active"
- ✅ Cập nhật table rendering để dùng đúng field names
- ✅ Filter dropdown giờ dùng typeId (1, 2, 3)

**State Management:**
```typescript
const [filterTypeId, setFilterTypeId] = useState<number | undefined>();
const [filterHubId, setFilterHubId] = useState<number | undefined>();
```

**Helper Function:**
```typescript
const formatSensorValue = (sensor: Sensor) => {
    const value = sensor.currentValue;
    let unit = '';
    
    switch (sensor.typeName) {
      case 'Temperature': unit = '°C'; break;
      case 'Humidity': unit = '%'; break;
      case 'Pressure': unit = 'hPa'; break;
    }
    
    return `${value.toFixed(2)} ${unit}`;
};
```

**Filter Dropdown:**
```tsx
<select 
  value={filterTypeId || ''}
  onChange={(e) => setFilterTypeId(e.target.value ? Number(e.target.value) : undefined)}
>
  <option value="">All Types</option>
  <option value="1">Temperature</option>
  <option value="2">Humidity</option>
  <option value="3">Pressure</option>
</select>
```

**Table Rendering:**
```tsx
{sensors.map((sensor) => (
  <tr key={sensor.sensorId}>
    <td>{sensor.sensorId}</td>
    <td>{sensor.sensorName}</td>
    <td>{sensor.typeName}</td>
    <td>{sensor.hubName}</td>
    <td>{formatSensorValue(sensor)}</td>
    <td>{sensor.status}</td>
    <td>{new Date(sensor.lastUpdate).toLocaleString('vi-VN')}</td>
  </tr>
))}
```

---

## 🎨 UI Features

### ✅ Filter Functionality
- Filter theo loại sensor (Temperature/Humidity/Pressure)
- Tự động re-fetch khi filter thay đổi

### ✅ Loading State
- Hiển thị spinner khi đang tải dữ liệu
- Ngăn user interaction khi loading

### ✅ Error Handling
- Hiển thị error message nếu API fail
- Nút "Thử lại" để retry

### ✅ Data Display
- Hiển thị đầy đủ thông tin sensor
- Format giá trị với đơn vị phù hợp (°C, %, hPa)
- Format thời gian theo locale Việt Nam
- Color coding theo status (Online/Offline)

### ✅ Refresh Button
- Manual refresh data
- Useful cho real-time monitoring

---

## 🔄 Luồng Hoạt Động

```
1. User mở Sensors Page
   ↓
2. useEffect() trigger → fetchSensors()
   ↓
3. sensorService.getAll(hubId, typeId)
   ↓
4. apiClient.get('/api/sensors', { params: { hub_id, type } })
   ↓
5. Backend xử lý request
   ↓
6. Response: { message, count, data: Sensor[] }
   ↓
7. setSensors(data)
   ↓
8. UI re-render với dữ liệu mới
```

---

## 📝 Mapping Fields

| API Response Field | Frontend Interface | Display Name     |
|-------------------|-------------------|------------------|
| `sensorId`        | `sensorId`        | Sensor ID        |
| `sensorName`      | `sensorName`      | Sensor Name      |
| `typeName`        | `typeName`        | Type             |
| `hubName`         | `hubName`         | Hub              |
| `currentValue`    | `currentValue`    | Value            |
| `status`          | `status`          | Status           |
| `lastUpdate`      | `lastUpdate`      | Last Updated     |

---

## 🧪 Testing

### Test Case 1: Fetch All Sensors
**Request:**
```bash
GET https://swd-project-api.onrender.com/api/sensors
Authorization: Bearer <token>
```

**Expected:**
- ✅ Hiển thị tất cả sensors
- ✅ Loading spinner xuất hiện rồi biến mất
- ✅ Data hiển thị đúng format

### Test Case 2: Filter by Type
**Action:** Chọn "Temperature" trong dropdown

**Request:**
```bash
GET https://swd-project-api.onrender.com/api/sensors?type=1
```

**Expected:**
- ✅ Chỉ hiển thị sensors có typeName = "Temperature"
- ✅ Auto re-fetch khi filter thay đổi

### Test Case 3: Error Handling
**Scenario:** Backend offline hoặc token expired

**Expected:**
- ✅ Hiển thị error message
- ✅ Nút "Thử lại" xuất hiện
- ✅ Click "Thử lại" → retry API call

---

## 💡 Key Points

1. **Snake Case Parameters:** API backend sử dụng `hub_id` (snake_case), không phải `hubId` (camelCase)

2. **Type ID vs Type Name:** 
   - Frontend filter dùng `typeId` (1, 2, 3)
   - Display dùng `typeName` ("Temperature", "Humidity", "Pressure")

3. **Status Values:**
   - API trả về: "Online", "Offline", "Warning"
   - Không phải "Active" như spec cũ

4. **Date Format:**
   - API: ISO string `"2026-02-03T07:42:01.422"`
   - Display: `new Date().toLocaleString('vi-VN')`

5. **Units:**
   - Temperature: °C
   - Humidity: %
   - Pressure: hPa

---

## 🚀 Next Steps (Optional)

- [ ] Thêm pagination nếu có nhiều sensors
- [ ] Thêm real-time updates với SignalR
- [ ] Thêm chart để visualize sensor data
- [ ] Thêm export to CSV functionality
- [ ] Thêm sensor detail modal

---

## ✅ Status: COMPLETED

Tích hợp API sensors đã hoàn thành và sẵn sàng sử dụng! 🎉

**Tested with:**
- API: `https://swd-project-api.onrender.com/api/sensors`
- Hub ID: 1
- Type: 1 (Temperature), 2 (Humidity), 3 (Pressure)
- Response: 3 sensors (Temp, Humidity, Pressure)
