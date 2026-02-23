# Implementation: Tự động đăng xuất sau 15 phút không hoạt động

## Trả lời câu hỏi

**Câu hỏi:** Nếu trong 15 phút người dùng không thực hiện thao tác nào sẽ tự động đăng xuất thì thay đổi token nào?

**Trả lời:** 
- ❌ **KHÔNG CẦN THAY ĐỔI TOKEN NÀO CẢ**
- ✅ Cần implement **logic track user activity** và tự động logout

## Giải thích

### Tại sao không cần thay đổi token?

1. **Access Token (15 phút)**: 
   - Thời gian hết hạn của token không liên quan đến việc tự động đăng xuất sau không hoạt động
   - Token hết hạn dựa trên thời gian tạo, không phải thời gian không hoạt động
   - Nếu thay đổi thời gian hết hạn của Access Token, sẽ ảnh hưởng đến tất cả users, không chỉ users không hoạt động

2. **Refresh Token (30 ngày)**:
   - Token này quyết định việc đăng nhập lại sau 30 ngày
   - Không liên quan đến việc tự động đăng xuất sau 15 phút không hoạt động

3. **Session Token (7 ngày)**:
   - Tương tự Refresh Token, không liên quan đến inactivity logout

### Giải pháp đã implement

Thay vì thay đổi token, đã implement **Activity Tracker** để:
1. Track các user interactions (click, scroll, keypress, mousemove, etc.)
2. Reset timer mỗi khi có activity
3. Tự động logout sau 15 phút không có activity
4. Clear tất cả tokens khi logout

## Cách hoạt động

### 1. Khi user đăng nhập:
```
User đăng nhập → startActivityTracking() → Bắt đầu track activity
```

### 2. Khi user hoạt động:
```
User click/scroll/type → updateActivity() → Reset timer về 0
```

### 3. Khi user không hoạt động 15 phút:
```
15 phút không activity → checkInactivity() → handleLogout() → Đăng xuất
```

### 4. Khi user logout:
```
handleLogout() → stopActivityTracking() → Clear tokens → Redirect
```

## Files đã tạo/sửa

### 1. `/lib/activity-tracker.ts` (MỚI)
- Track user activity
- Tự động logout sau 15 phút không hoạt động
- Functions:
  - `startActivityTracking()`: Bắt đầu track
  - `stopActivityTracking()`: Dừng track
  - `resetInactivityTimer()`: Reset timer
  - `updateActivity()`: Update thời gian hoạt động cuối cùng

### 2. `/components/DauTrang.tsx` (SỬA)
- Import activity tracker
- Start tracking khi user đăng nhập
- Stop tracking khi user logout
- Reset timer khi route changes hoặc window focus

### 3. `/lib/api.ts` (SỬA)
- Reset inactivity timer mỗi khi có API call
- Đảm bảo API calls được tính là activity

## Các sự kiện được track

- `mousedown` - Click chuột
- `mousemove` - Di chuyển chuột
- `keypress` - Nhấn phím
- `scroll` - Cuộn trang
- `touchstart` - Touch trên mobile
- `click` - Click
- `focus` - Window focus

## Cấu hình

Thời gian không hoạt động: **15 phút** (có thể thay đổi trong `lib/activity-tracker.ts`)

```typescript
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000 // 15 phút
```

## Tóm tắt

| Token | Có thay đổi? | Lý do |
|-------|--------------|-------|
| **Access Token** | ❌ Không | Thời gian hết hạn không liên quan đến inactivity |
| **Refresh Token** | ❌ Không | Quyết định đăng nhập lại sau 30 ngày |
| **Session Token** | ❌ Không | Backup token, không liên quan |

**Giải pháp:** Implement Activity Tracker để track user activity và tự động logout

## Kết quả

✅ **Đã implement thành công:**
- Tự động đăng xuất sau 15 phút không hoạt động
- Track tất cả user interactions
- Reset timer khi có activity
- Clear tokens khi logout
- Không cần thay đổi token nào cả
