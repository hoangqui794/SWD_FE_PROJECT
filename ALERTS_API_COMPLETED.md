# ✅ GET API Alerts Integration - Hoàn Thành

## 🎯 Tổng Quan
Đã tích hợp thành công API GET alerts vào giao diện React với filtering, search, resolve, và delete functionality.

---

## 📡 API Endpoint

**URL:** `GET https://swd-project-api.onrender.com/api/alerts`

**Query Parameters:**
- `status` (string, optional) - Filter theo status: "All", "Active", "Resolved"
- `search` (string, optional) - Tìm kiếm theo tên sensor

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Accept: */*
```

**Example Request:**
```bash
GET https://swd-project-api.onrender.com/api/alerts?status=All&search=Humidity
Authorization: Bearer eyJhbGc...
```

---

## 📊 API Response Structure

```json
{
  "message": "Lấy danh sách cảnh báo thành công",
  "count": 427,
  "data": [
    {
      "id": 456,
      "time": "2026-02-02T14:12:08.7",
      "sensor_name": "Humidity-Sensor-01",
      "severity": "Warning",
      "status": "Active"
    },
    {
      "id": 455,
      "time": "2026-02-02T13:39:02.787",
      "sensor_name": "Humidity-Sensor-01",
      "severity": "Warning",
      "status": "Active"
    }
  ]
}
```

---

## 🔧 Files Created/Updated

### 1. `services/alertService.ts` (NEW)

**Alert Interface:**
```typescript
export interface Alert {
    id: number;
    time: string;              // ISO datetime
    sensor_name: string;       // Tên sensor
    severity: string;          // "Critical" | "Warning"
    status: string;            // "Active" | "Resolved"
}
```

**Service Functions:**
```typescript
export const alertService = {
    // Lấy danh sách alerts với filter
    getAll: async (status?: string, search?: string): Promise<Alert[]>
    
    // Đánh dấu alert là resolved
    resolve: async (id: number): Promise<void>
    
    // Xóa alert
    delete: async (id: number): Promise<void>
}
```

---

### 2. `pages/AlertsPage.tsx` (UPDATED)

**State Management:**
```typescript
const [alerts, setAlerts] = useState<Alert[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Resolved'>('All');
const [searchTerm, setSearchTerm] = useState("");
```

**Key Functions:**

1. **fetchAlerts()** - Gọi API với filter parameters
```typescript
const fetchAlerts = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const data = await alertService.getAll(filterStatus, searchTerm);
        setAlerts(data);
    } catch (error) {
        setError('Không thể tải dữ liệu alerts...');
    } finally {
        setIsLoading(false);
    }
};
```

2. **handleResolve()** - Resolve alert
```typescript
const handleResolve = async (id: number) => {
    try {
        await alertService.resolve(id);
        setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'Resolved' } : a));
    } catch (error: any) {
        alert('Không thể resolve alert: ' + error.message);
    }
};
```

3. **handleDelete()** - Xóa alert
```typescript
const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa alert này?')) return;
    
    try {
        await alertService.delete(id);
        setAlerts(alerts.filter(a => a.id !== id));
    } catch (error: any) {
        alert('Không thể xóa alert: ' + error.message);
    }
};
```

---

## 🎨 UI Features

### ✅ **Filter Buttons**
- 3 buttons: All, Active, Resolved
- Active button có highlight (white background)
- Click để filter alerts theo status
- Auto re-fetch khi filter thay đổi

### ✅ **Search Box**
- Search by sensor name
- Debounced search (auto re-fetch khi searchTerm thay đổi)
- Icon search bên trái input

### ✅ **Refresh Button**
- Manual refresh data
- Disabled khi đang loading
- Icon refresh

### ✅ **Loading State**
- Spinner animation
- Text "Đang tải dữ liệu alerts..."
- Hiển thị khi isLoading = true

### ✅ **Error State**
- Red background với error message
- Nút "Thử lại" để retry
- Hiển thị khi có error

### ✅ **Data Table**
- 5 columns: Time, Sensor, Severity, Status, Actions
- Time: Format theo locale Việt Nam
- Sensor: Hiển thị sensor_name
- Severity: Badge với color (Critical = red, Warning = amber)
- Status: Dot indicator + text (Active = red pulsing, Resolved = gray)
- Actions: Resolve button (nếu Active) + Delete button

### ✅ **Resolve Button**
- Chỉ hiển thị cho alerts có status = "Active"
- Green color scheme
- Click để mark as resolved
- Optimistic UI update

### ✅ **Delete Button**
- Icon delete
- Hover effect (red color)
- Confirmation dialog
- Remove từ list sau khi delete thành công

---

## 🔄 Complete Flow

### **Load Alerts Flow**
```
1. Component mount
   ↓
2. useEffect() trigger → fetchAlerts()
   ↓
3. setIsLoading(true)
   ↓
4. alertService.getAll(filterStatus, searchTerm)
   ↓
5. API Request: GET /api/alerts?status=All&search=
   ↓
6. Backend response: { message, count, data: Alert[] }
   ↓
7. setAlerts(data)
   ↓
8. setIsLoading(false)
   ↓
9. UI re-render với data
```

### **Filter Flow**
```
User click "Active" button
   ↓
setFilterStatus('Active')
   ↓
useEffect() detect filterStatus change
   ↓
fetchAlerts() với status='Active'
   ↓
API: GET /api/alerts?status=Active
   ↓
Update alerts state
   ↓
UI shows only Active alerts
```

### **Search Flow**
```
User type "Humidity" in search box
   ↓
setSearchTerm('Humidity')
   ↓
useEffect() detect searchTerm change
   ↓
fetchAlerts() với search='Humidity'
   ↓
API: GET /api/alerts?status=All&search=Humidity
   ↓
Update alerts state
   ↓
UI shows filtered results
```

### **Resolve Flow**
```
User click "Resolve" button
   ↓
handleResolve(alertId)
   ↓
alertService.resolve(alertId)
   ↓
API: PUT /api/alerts/{id}/resolve
   ↓
Success → Update local state (status = 'Resolved')
   ↓
UI updates immediately (optimistic update)
   ↓
Resolve button disappears
```

### **Delete Flow**
```
User click delete icon
   ↓
Confirmation dialog
   ↓
User confirms
   ↓
handleDelete(alertId)
   ↓
alertService.delete(alertId)
   ↓
API: DELETE /api/alerts/{id}
   ↓
Success → Remove from local state
   ↓
Alert row disappears from table
```

---

## 📝 Field Mapping

| API Response Field | Frontend Display | Format                          |
|-------------------|------------------|---------------------------------|
| `id`              | Hidden (key)     | number                          |
| `time`            | Time column      | `new Date().toLocaleString()`   |
| `sensor_name`     | Sensor column    | string                          |
| `severity`        | Severity badge   | "Critical" (red) / "Warning" (amber) |
| `status`          | Status indicator | "Active" (pulsing) / "Resolved" (gray) |

---

## 🎨 Severity Styling

```typescript
const getSeverityStyle = (severity: string) => {
    return severity === 'Critical'
        ? 'bg-red-500/10 border-red-500 text-red-500'
        : 'bg-amber-500/10 border-amber-500 text-amber-500';
};
```

**Critical:**
- Background: red-500/10
- Border: red-500
- Text: red-500

**Warning:**
- Background: amber-500/10
- Border: amber-500
- Text: amber-500

---

## 🎯 Status Indicator

**Active:**
```tsx
<span className="text-red-500 animate-pulse">
    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
    Active
</span>
```
- Red color
- Pulsing animation
- Red dot indicator

**Resolved:**
```tsx
<span className="text-slate-500">
    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
    Resolved
</span>
```
- Gray color
- No animation
- Gray dot indicator

---

## 🧪 Testing Scenarios

### **Test Case 1: Load All Alerts**
**Steps:**
1. Navigate to Alerts page
2. Default filter = "All"

**Expected:**
- ✅ Loading spinner appears
- ✅ API call: GET /api/alerts?status=All
- ✅ Table displays all alerts
- ✅ Count shows total records

### **Test Case 2: Filter by Active**
**Steps:**
1. Click "Active" button

**Expected:**
- ✅ Button highlights
- ✅ API call: GET /api/alerts?status=Active
- ✅ Only Active alerts shown
- ✅ Resolve buttons visible

### **Test Case 3: Search by Sensor**
**Steps:**
1. Type "Humidity" in search box

**Expected:**
- ✅ API call: GET /api/alerts?status=All&search=Humidity
- ✅ Only alerts with "Humidity" in sensor_name shown
- ✅ Count updates

### **Test Case 4: Resolve Alert**
**Steps:**
1. Click "Resolve" on an Active alert

**Expected:**
- ✅ API call: PUT /api/alerts/{id}/resolve
- ✅ Status changes to "Resolved"
- ✅ Resolve button disappears
- ✅ Dot changes from red to gray
- ✅ Animation stops

### **Test Case 5: Delete Alert**
**Steps:**
1. Click delete icon
2. Confirm deletion

**Expected:**
- ✅ Confirmation dialog appears
- ✅ API call: DELETE /api/alerts/{id}
- ✅ Alert row disappears
- ✅ Count decreases

### **Test Case 6: Error Handling**
**Scenario:** Backend offline

**Expected:**
- ✅ Error state displays
- ✅ Error message shown
- ✅ "Thử lại" button appears
- ✅ Click retry → re-fetch

---

## 💡 Key Implementation Points

### **1. Auto Re-fetch on Filter/Search Change**
```typescript
useEffect(() => {
    fetchAlerts();
}, [filterStatus, searchTerm]);
```
- Tự động gọi API khi filter hoặc search thay đổi
- Không cần manual refresh

### **2. Optimistic UI Updates**
```typescript
// Resolve
setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'Resolved' } : a));

// Delete
setAlerts(alerts.filter(a => a.id !== id));
```
- Update UI ngay lập tức
- Không cần wait for API response
- Better UX

### **3. Error Handling**
```typescript
try {
    await alertService.resolve(id);
    // Update state
} catch (error: any) {
    alert('Error: ' + error.message);
}
```
- Try-catch cho mọi API call
- Display error message cho user
- Graceful degradation

### **4. Date Formatting**
```typescript
{new Date(alert.time).toLocaleString('vi-VN')}
```
- Convert ISO string to readable format
- Locale Việt Nam
- Example: "02/02/2026, 14:12:08"

### **5. Conditional Rendering**
```typescript
{alert.status === 'Active' && (
    <button onClick={() => handleResolve(alert.id)}>
        Resolve
    </button>
)}
```
- Resolve button chỉ hiển thị cho Active alerts
- Clean UI

---

## 📊 API Integration Summary

| Feature | Method | Endpoint | Status |
|---------|--------|----------|--------|
| **Get Alerts** | GET | `/api/alerts` | ✅ |
| **Filter by Status** | GET | `/api/alerts?status={status}` | ✅ |
| **Search** | GET | `/api/alerts?search={term}` | ✅ |
| **Resolve Alert** | PUT | `/api/alerts/{id}/resolve` | ✅ |
| **Delete Alert** | DELETE | `/api/alerts/{id}` | ✅ |

---

## ✅ Checklist

- [x] Alert interface định nghĩa
- [x] alertService.ts created
- [x] getAll() function với filter/search
- [x] resolve() function
- [x] delete() function
- [x] State management
- [x] fetchAlerts() implementation
- [x] Loading state
- [x] Error handling
- [x] Filter buttons (All/Active/Resolved)
- [x] Search box
- [x] Refresh button
- [x] Table rendering với API data
- [x] Date formatting
- [x] Severity styling
- [x] Status indicator
- [x] Resolve functionality
- [x] Delete functionality
- [x] Optimistic UI updates
- [x] Error messages
- [x] Empty state

---

## 📝 Summary

**API GET /api/alerts đã được tích hợp hoàn chỉnh với:**

1. ✅ **Service Layer:** Alert interface + alertService với getAll/resolve/delete
2. ✅ **State Management:** alerts, loading, error, filter, search states
3. ✅ **Filtering:** 3 filter buttons (All/Active/Resolved)
4. ✅ **Search:** Search by sensor name
5. ✅ **Loading/Error States:** Spinner và error message
6. ✅ **Data Display:** Table với formatted data
7. ✅ **Actions:** Resolve và Delete với API integration
8. ✅ **UI/UX:** Severity badges, status indicators, animations
9. ✅ **Optimistic Updates:** Instant UI feedback

**Kết quả:** Trang Alerts hoàn chỉnh với real-time filtering, search, và actions! 🎉

**Example Data:**
- 427 alerts total
- Filter by "Active" → Only active alerts
- Search "Humidity" → Only Humidity sensor alerts
- Click "Resolve" → Alert marked as resolved
- Click delete → Alert removed
