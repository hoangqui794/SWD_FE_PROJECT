# ✅ POST API Sensors Integration - Hoàn Thành

## 🎯 Tổng Quan
Đã tích hợp thành công API POST để tạo sensor mới vào giao diện React với form validation và error handling đầy đủ.

---

## 📡 API Endpoint

**URL:** `POST https://swd-project-api.onrender.com/api/sensors`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
Accept: */*
```

**Request Body:**
```json
{
  "name": "string",      // Tên sensor (VD: "Temp-Sensor-01")
  "typeId": 0,           // ID loại sensor (1: Temperature, 2: Humidity, 3: Pressure)
  "hubId": 0             // ID của hub
}
```

**Example Request:**
```json
{
  "name": "Temp-Sensor-02",
  "typeId": 1,
  "hubId": 1
}
```

---

## 🔧 Implementation Details

### 1. **Interface Update** (`sensorService.ts`)

```typescript
export interface CreateSensorRequest {
    name: string;      // Tên sensor
    typeId: number;    // 1: Temperature, 2: Humidity, 3: Pressure
    hubId: number;     // ID của hub
}
```

### 2. **Service Function** (`sensorService.ts`)

```typescript
create: async (data: CreateSensorRequest): Promise<void> => {
    await apiClient.post('/api/sensors', data);
}
```

**Luồng hoạt động:**
```
formData → sensorService.create() → apiClient.post() → Backend API
```

---

## 🎨 UI Implementation (`SensorsPage.tsx`)

### **State Management**

```typescript
// Form state
const [formData, setFormData] = useState<CreateSensorRequest>({
    name: '',
    typeId: 1,
    hubId: 0
});

// Hubs list để populate dropdown
const [hubs, setHubs] = useState<Hub[]>([]);

// Submitting state
const [isSubmitting, setIsSubmitting] = useState(false);
```

### **Fetch Hubs Function**

```typescript
const fetchHubs = async () => {
    try {
        const data = await hubService.getAll();
        setHubs(data);
    } catch (error) {
        console.error("Failed to fetch hubs", error);
    }
};
```

### **Create Sensor Handler**

```typescript
const handleCreateSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
        alert('Vui lòng nhập tên sensor');
        return;
    }
    if (formData.hubId === 0) {
        alert('Vui lòng chọn Hub');
        return;
    }

    setIsSubmitting(true);
    try {
        // Gọi API
        await sensorService.create(formData);
        
        // Reset form
        setFormData({ name: '', typeId: 1, hubId: 0 });
        
        // Đóng modal và refresh
        setIsModalOpen(false);
        fetchSensors();
        
        alert('Tạo sensor thành công!');
    } catch (error: any) {
        const errorMsg = error.response?.data?.message || 'Không thể tạo sensor';
        alert(`Lỗi: ${errorMsg}`);
    } finally {
        setIsSubmitting(false);
    }
};
```

---

## 📋 Form Fields

### **1. Sensor Name** (Required)
- Type: Text input
- Placeholder: "e.g. Temp-Sensor-01"
- Validation: Không được để trống
- Binding: `formData.name`

### **2. Hub** (Required)
- Type: Dropdown select
- Options: Dynamic từ API `/api/hubs`
- Display: `{hub.name} ({hub.siteName})`
- Value: `hub.hubId`
- Validation: Phải chọn hub (hubId !== 0)
- Binding: `formData.hubId`

### **3. Type** (Required)
- Type: Dropdown select
- Options:
  - Temperature (typeId: 1)
  - Humidity (typeId: 2)
  - Pressure (typeId: 3)
- Default: Temperature (1)
- Binding: `formData.typeId`

---

## ✅ Features Implemented

### **1. Form Validation**
- ✅ Required field validation
- ✅ Hub selection validation
- ✅ Alert messages cho user

### **2. Dynamic Hub List**
- ✅ Fetch hubs từ API khi component mount
- ✅ Populate dropdown với real data
- ✅ Display format: "Hub Name (Site Name)"

### **3. Loading States**
- ✅ `isSubmitting` state để disable buttons
- ✅ Button text thay đổi: "Register" → "Creating..."
- ✅ Disable form khi đang submit

### **4. Error Handling**
- ✅ Try-catch block
- ✅ Display error message từ API
- ✅ Fallback error message

### **5. Success Flow**
- ✅ Reset form sau khi tạo thành công
- ✅ Đóng modal
- ✅ Auto refresh danh sách sensors
- ✅ Success alert

### **6. Edge Cases**
- ✅ Warning khi không có Hub nào
- ✅ Disable submit button khi không có Hub
- ✅ Auto-select first hub khi mở modal

---

## 🔄 Complete Flow

```
1. User click "Register Sensor" button
   ↓
2. handleOpenCreateModal() được gọi
   - Reset formData
   - Auto-select first hub nếu có
   - Mở modal
   ↓
3. User điền form
   - Nhập tên sensor
   - Chọn Hub từ dropdown
   - Chọn Type (Temperature/Humidity/Pressure)
   ↓
4. User click "Register" button
   ↓
5. handleCreateSensor() được gọi
   - Validate form
   - setIsSubmitting(true)
   ↓
6. sensorService.create(formData)
   ↓
7. API Request:
   POST /api/sensors
   Body: { name, typeId, hubId }
   Headers: Authorization Bearer token
   ↓
8. Backend xử lý
   ↓
9. Response thành công
   ↓
10. Frontend:
    - Reset form
    - Đóng modal
    - fetchSensors() → Refresh list
    - Show success alert
    - setIsSubmitting(false)
```

---

## 🎨 UI/UX Enhancements

### **Form Design**
- Modern dark theme với zinc-900 background
- Focus ring với primary color
- Proper spacing và typography
- Required field indicators (*)

### **Dropdown Styling**
- Consistent với design system
- Clear placeholder text
- Disabled state styling

### **Button States**
```typescript
// Normal state
className="bg-primary text-white hover:bg-primary/80"

// Submitting state
disabled={isSubmitting}
className="disabled:opacity-50 disabled:cursor-not-allowed"

// Text changes
{isSubmitting ? 'Creating...' : 'Register'}
```

### **Warning Message**
```tsx
{hubs.length === 0 && (
  <div className="bg-yellow-500/10 border border-yellow-500/20">
    <p className="text-yellow-500">
      ⚠️ Không có Hub nào. Vui lòng tạo Hub trước.
    </p>
  </div>
)}
```

---

## 🧪 Testing Scenarios

### **Test Case 1: Successful Creation**
**Steps:**
1. Click "Register Sensor"
2. Nhập name: "Test-Sensor-01"
3. Chọn Hub: "EOH-Hub-HCMC-ThuDuc"
4. Chọn Type: "Temperature"
5. Click "Register"

**Expected:**
- ✅ API call thành công
- ✅ Modal đóng
- ✅ Alert "Tạo sensor thành công!"
- ✅ Sensor mới xuất hiện trong list

### **Test Case 2: Validation Error**
**Steps:**
1. Click "Register Sensor"
2. Để trống name
3. Click "Register"

**Expected:**
- ✅ Alert "Vui lòng nhập tên sensor"
- ✅ Form không submit

### **Test Case 3: No Hubs Available**
**Steps:**
1. Database không có Hub nào
2. Click "Register Sensor"

**Expected:**
- ✅ Warning message hiển thị
- ✅ Submit button bị disable
- ✅ Hub dropdown chỉ có "Select Hub"

### **Test Case 4: API Error**
**Steps:**
1. Backend offline hoặc token expired
2. Fill form và submit

**Expected:**
- ✅ Catch error
- ✅ Alert với error message
- ✅ Modal vẫn mở
- ✅ Form data giữ nguyên

---

## 📊 Data Mapping

| Form Field    | State Variable    | API Field | Type   | Example              |
|--------------|-------------------|-----------|--------|----------------------|
| Sensor Name  | `formData.name`   | `name`    | string | "Temp-Sensor-01"     |
| Hub          | `formData.hubId`  | `hubId`   | number | 1                    |
| Type         | `formData.typeId` | `typeId`  | number | 1 (Temperature)      |

---

## 💡 Key Implementation Points

### **1. Controlled Components**
```tsx
<input 
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
/>
```

### **2. Form Submit Handler**
```tsx
<form onSubmit={handleCreateSensor}>
  {/* preventDefault() được gọi trong handler */}
</form>
```

### **3. Dynamic Options**
```tsx
{hubs.map(hub => (
  <option key={hub.hubId} value={hub.hubId}>
    {hub.name} ({hub.siteName})
  </option>
))}
```

### **4. Conditional Rendering**
```tsx
{hubs.length === 0 && <WarningMessage />}
```

### **5. Button Disabled Logic**
```tsx
disabled={isSubmitting || hubs.length === 0}
```

---

## 🚀 Future Enhancements (Optional)

- [ ] Add sensor configuration fields (min/max values)
- [ ] Add sensor description field
- [ ] Implement edit sensor functionality
- [ ] Add delete confirmation modal
- [ ] Add bulk sensor creation
- [ ] Add sensor import from CSV
- [ ] Add sensor status toggle (enable/disable)

---

## ✅ Checklist

- [x] CreateSensorRequest interface định nghĩa
- [x] sensorService.create() function
- [x] Form state management
- [x] Fetch hubs list
- [x] Dynamic hub dropdown
- [x] Form validation
- [x] Submit handler
- [x] Loading states
- [x] Error handling
- [x] Success flow
- [x] Reset form
- [x] Auto refresh list
- [x] Warning for no hubs
- [x] Disable states
- [x] UI/UX polish

---

## 📝 Summary

**API POST /api/sensors đã được tích hợp hoàn chỉnh với:**

1. ✅ **Service Layer:** CreateSensorRequest interface + create() function
2. ✅ **State Management:** Form data, hubs list, submitting state
3. ✅ **Form Validation:** Required fields, hub selection
4. ✅ **Dynamic Data:** Hub dropdown từ API
5. ✅ **Error Handling:** Try-catch, error messages
6. ✅ **Success Flow:** Reset, close, refresh, alert
7. ✅ **UI/UX:** Loading states, disabled states, warnings
8. ✅ **Edge Cases:** No hubs, API errors

**Kết quả:** Form tạo sensor hoàn chỉnh, user-friendly, với validation và error handling tốt! 🎉
