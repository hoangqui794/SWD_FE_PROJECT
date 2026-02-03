# ✅ Pagination Feature - Hoàn Thành

## 🎯 Tổng Quan
Đã thêm thành công tính năng phân trang (pagination) cho trang Alerts với 20 alerts mỗi trang, giúp xử lý 427+ alerts một cách hiệu quả.

---

## 📊 Pagination Configuration

**Settings:**
- **Page Size:** 20 alerts per page
- **Pagination Type:** Client-side pagination
- **Total Pages:** Calculated dynamically based on total count
- **Page Display:** Shows up to 5 page numbers at a time

---

## 🔧 Implementation Details

### **1. State Management**

```typescript
// Pagination state
const [currentPage, setCurrentPage] = useState(1);
const [pageSize] = useState(20); // 20 alerts per page
const [totalCount, setTotalCount] = useState(0);

// Calculate total pages
const totalPages = Math.ceil(totalCount / pageSize);
```

**State Variables:**
- `currentPage`: Trang hiện tại (1-indexed)
- `pageSize`: Số alerts mỗi trang (20)
- `totalCount`: Tổng số alerts
- `totalPages`: Tổng số trang (calculated)

---

### **2. Core Functions**

#### **getPaginatedAlerts()**
```typescript
const getPaginatedAlerts = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return alerts.slice(startIndex, endIndex);
};
```
- Tính start và end index cho trang hiện tại
- Slice alerts array để lấy data cho trang đó
- Return 20 alerts (hoặc ít hơn nếu là trang cuối)

#### **Navigation Functions**
```typescript
const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
    }
};

const goToNextPage = () => goToPage(currentPage + 1);
const goToPrevPage = () => goToPage(currentPage - 1);
const goToFirstPage = () => goToPage(1);
const goToLastPage = () => goToPage(totalPages);
```

#### **Reset Page on Filter/Search**
```typescript
const handleFilterChange = (status: 'All' | 'Active' | 'Resolved') => {
    setFilterStatus(status);
    setCurrentPage(1); // Reset về trang 1
};

const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset về trang 1
};
```

---

### **3. UI Components**

#### **Record Count Display**
```typescript
<div className="text-xs font-mono text-slate-500">
    Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
</div>
```
**Example Output:**
- Page 1: "Showing 1-20 of 427"
- Page 2: "Showing 21-40 of 427"
- Last page: "Showing 421-427 of 427"

#### **Pagination Controls**
```tsx
{!isLoading && !error && totalPages > 1 && (
    <div className="pagination-controls">
        {/* First Page Button */}
        <button onClick={goToFirstPage} disabled={currentPage === 1}>
            <span className="material-symbols-outlined">first_page</span>
        </button>

        {/* Previous Button */}
        <button onClick={goToPrevPage} disabled={currentPage === 1}>
            <span className="material-symbols-outlined">chevron_left</span>
        </button>

        {/* Page Numbers (up to 5) */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Smart page number calculation
            let pageNum = calculatePageNum(i);
            return (
                <button 
                    onClick={() => goToPage(pageNum)}
                    className={currentPage === pageNum ? 'active' : ''}
                >
                    {pageNum}
                </button>
            );
        })}

        {/* Next Button */}
        <button onClick={goToNextPage} disabled={currentPage === totalPages}>
            <span className="material-symbols-outlined">chevron_right</span>
        </button>

        {/* Last Page Button */}
        <button onClick={goToLastPage} disabled={currentPage === totalPages}>
            <span className="material-symbols-outlined">last_page</span>
        </button>
    </div>
)}
```

---

## 🎨 UI Design

### **Pagination Bar Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ Page 3 of 22        [<<] [<] [1][2][3][4][5] [>] [>>]      │
└─────────────────────────────────────────────────────────────┘
```

### **Button States**

**Active Page:**
- Background: White
- Text: Black
- Font: Bold

**Inactive Pages:**
- Background: zinc-800
- Text: White
- Hover: zinc-700

**Disabled Buttons:**
- Opacity: 30%
- Cursor: not-allowed
- No hover effect

---

## 🔄 Page Number Display Logic

**Scenario 1: Total Pages ≤ 5**
```
Total: 4 pages
Display: [1] [2] [3] [4]
```

**Scenario 2: Current Page ≤ 3**
```
Current: Page 2 of 22
Display: [1] [2] [3] [4] [5]
```

**Scenario 3: Current Page ≥ Total - 2**
```
Current: Page 21 of 22
Display: [18] [19] [20] [21] [22]
```

**Scenario 4: Middle Pages**
```
Current: Page 10 of 22
Display: [8] [9] [10] [11] [12]
```

**Logic:**
```typescript
let pageNum;
if (totalPages <= 5) {
    pageNum = i + 1;
} else if (currentPage <= 3) {
    pageNum = i + 1;
} else if (currentPage >= totalPages - 2) {
    pageNum = totalPages - 4 + i;
} else {
    pageNum = currentPage - 2 + i;
}
```

---

## 📊 Data Flow

### **Initial Load**
```
1. Component mount
   ↓
2. fetchAlerts()
   ↓
3. setAlerts(data) + setTotalCount(data.length)
   ↓
4. totalPages = Math.ceil(427 / 20) = 22
   ↓
5. getPaginatedAlerts() → alerts[0-19]
   ↓
6. Display first 20 alerts
   ↓
7. Show pagination controls (if totalPages > 1)
```

### **Page Navigation**
```
User clicks "Next" button
   ↓
goToNextPage()
   ↓
goToPage(currentPage + 1)
   ↓
setCurrentPage(2)
   ↓
useEffect() triggers (currentPage dependency)
   ↓
fetchAlerts() (re-fetch with same filters)
   ↓
getPaginatedAlerts() → alerts[20-39]
   ↓
Display alerts 21-40
```

### **Filter Change**
```
User clicks "Active" filter
   ↓
handleFilterChange('Active')
   ↓
setFilterStatus('Active') + setCurrentPage(1)
   ↓
useEffect() triggers
   ↓
fetchAlerts() with status='Active'
   ↓
New filtered data
   ↓
Reset to page 1
   ↓
Display first 20 filtered alerts
```

---

## ✅ Features Implemented

### **1. Navigation Buttons**
- ✅ First Page (<<)
- ✅ Previous Page (<)
- ✅ Next Page (>)
- ✅ Last Page (>>)
- ✅ Disabled states when at boundaries

### **2. Page Numbers**
- ✅ Display up to 5 page numbers
- ✅ Smart pagination (shows pages around current)
- ✅ Active page highlight
- ✅ Click to jump to specific page

### **3. Page Info**
- ✅ "Page X of Y" display
- ✅ "Showing X-Y of Z" record count
- ✅ Dynamic updates

### **4. Auto Reset**
- ✅ Reset to page 1 when filter changes
- ✅ Reset to page 1 when search changes
- ✅ Maintain page when refreshing

### **5. Edge Cases**
- ✅ Handle totalPages = 1 (hide pagination)
- ✅ Handle last page with fewer items
- ✅ Handle delete reducing total count
- ✅ Disable buttons at boundaries

---

## 🧪 Testing Scenarios

### **Test Case 1: Basic Navigation**
**Steps:**
1. Load page (427 alerts)
2. Click "Next" button

**Expected:**
- ✅ currentPage = 2
- ✅ Display alerts 21-40
- ✅ "Showing 21-40 of 427"
- ✅ Previous button enabled
- ✅ Page 2 highlighted

### **Test Case 2: Jump to Last Page**
**Steps:**
1. Click "Last Page" button

**Expected:**
- ✅ currentPage = 22
- ✅ Display alerts 421-427 (7 alerts)
- ✅ "Showing 421-427 of 427"
- ✅ Next button disabled
- ✅ Last button disabled

### **Test Case 3: Filter Reset**
**Steps:**
1. Navigate to page 5
2. Click "Active" filter

**Expected:**
- ✅ currentPage resets to 1
- ✅ Display first 20 Active alerts
- ✅ totalCount updates
- ✅ totalPages recalculates

### **Test Case 4: Search Reset**
**Steps:**
1. Navigate to page 3
2. Type "Humidity" in search

**Expected:**
- ✅ currentPage resets to 1
- ✅ Display first 20 matching alerts
- ✅ Pagination updates based on search results

### **Test Case 5: Delete on Last Page**
**Steps:**
1. Go to last page (7 alerts)
2. Delete 1 alert

**Expected:**
- ✅ totalCount = 426
- ✅ Still on page 22
- ✅ Display 6 alerts
- ✅ "Showing 421-426 of 426"

---

## 💡 Key Implementation Points

### **1. Client-Side Pagination**
```typescript
// API returns all data
const data = await alertService.getAll(filterStatus, searchTerm);
setAlerts(data); // Store all alerts

// Paginate on client
const paginated = getPaginatedAlerts(); // Slice for current page
```

**Why Client-Side?**
- API doesn't support pagination parameters yet
- All data needed for filtering/search anyway
- Good performance for <1000 records

### **2. Conditional Rendering**
```typescript
{!isLoading && !error && totalPages > 1 && (
    <PaginationControls />
)}
```
- Only show if not loading
- Only show if no error
- Only show if more than 1 page

### **3. Disabled State Logic**
```typescript
disabled={currentPage === 1} // First/Prev buttons
disabled={currentPage === totalPages} // Next/Last buttons
```

### **4. Page Number Calculation**
- Always show 5 page numbers (or less if totalPages < 5)
- Center around current page
- Handle edge cases (start/end)

---

## 📊 Performance Considerations

**Current Implementation:**
- ✅ All data fetched once
- ✅ Pagination done in memory (fast)
- ✅ No additional API calls for page changes
- ✅ Re-fetch only on filter/search change

**Scalability:**
- Works well for <1000 alerts
- For >1000 alerts, consider server-side pagination
- Could add virtual scrolling for very large datasets

---

## 🎯 User Experience

### **Benefits:**
1. **Easy Navigation:** Clear buttons and page numbers
2. **Visual Feedback:** Active page highlighted
3. **Disabled States:** Can't go beyond boundaries
4. **Smart Reset:** Auto reset to page 1 on filter/search
5. **Info Display:** Always know where you are

### **Interactions:**
- Click page number → Jump to that page
- Click arrows → Move one page
- Click double arrows → Jump to first/last
- Filter/Search → Auto reset to page 1

---

## ✅ Summary

**Pagination đã được implement hoàn chỉnh với:**

1. ✅ **State Management:** currentPage, pageSize, totalCount, totalPages
2. ✅ **Navigation Functions:** goToPage, goToNext, goToPrev, goToFirst, goToLast
3. ✅ **Smart Page Display:** Shows 5 pages around current page
4. ✅ **Auto Reset:** Reset to page 1 on filter/search
5. ✅ **UI Controls:** First, Prev, Page Numbers, Next, Last buttons
6. ✅ **Disabled States:** Proper button disabling at boundaries
7. ✅ **Info Display:** "Page X of Y" and "Showing X-Y of Z"
8. ✅ **Edge Cases:** Handle all scenarios properly

**Kết quả:**
- 427 alerts → 22 pages
- 20 alerts per page
- Smooth navigation
- Clean UI
- Great UX! 🎉

**Example:**
```
Page 1: Alerts 1-20
Page 2: Alerts 21-40
...
Page 22: Alerts 421-427
```
