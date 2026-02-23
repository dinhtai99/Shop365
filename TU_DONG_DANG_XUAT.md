# Tự động đăng xuất sau thời gian không hoạt động

## Tình trạng hiện tại

### ❌ KHÔNG có tự động đăng xuất sau 15 phút không truy cập

**Lý do:**
- Access Token hết hạn sau **15 phút**
- Nhưng Access Token được lưu trong **memory** (không phải cookie)
- Khi người dùng quay lại sau 15 phút:
  1. Access Token trong memory đã hết hạn hoặc bị mất (do refresh page)
  2. Hệ thống **tự động refresh** Access Token từ **Refresh Token cookie** (30 ngày)
  3. Người dùng **KHÔNG bị đăng xuất**, vẫn đăng nhập bình thường

## Token nào quyết định việc đăng xuất?

### 1. Access Token (15 phút)
- ❌ **KHÔNG** tự động đăng xuất sau 15 phút không truy cập
- ✅ Tự động refresh khi cần
- ✅ Chỉ đăng xuất nếu Refresh Token cũng hết hạn

### 2. Refresh Token (30 ngày) - **Token quyết định đăng xuất**
- ✅ **ĐÂY LÀ TOKEN QUYẾT ĐỊNH** việc đăng xuất
- ✅ Sau **30 ngày**, Refresh Token hết hạn
- ✅ Không thể refresh Access Token nữa
- ✅ **Người dùng phải đăng nhập lại**

### 3. Session Token (7 ngày)
- ✅ Fallback nếu Refresh Token hết hạn
- ✅ Sau **7 ngày**, Session Token hết hạn
- ✅ Nếu cả Refresh Token và Session Token hết hạn → **Phải đăng nhập lại**

## Kịch bản thực tế

### Kịch bản 1: Người dùng không truy cập 15 phút
```
1. Access Token hết hạn (15 phút)
2. Người dùng quay lại → Refresh page
3. Access Token trong memory = null
4. Hệ thống tự động gọi /api/auth/refresh với Refresh Token cookie
5. Server tạo Access Token mới
6. ✅ Người dùng VẪN ĐĂNG NHẬP, không bị đăng xuất
```

### Kịch bản 2: Người dùng không truy cập 30 ngày
```
1. Refresh Token hết hạn (30 ngày)
2. Người dùng quay lại → Refresh page
3. Access Token trong memory = null
4. Hệ thống cố gắng refresh nhưng Refresh Token đã hết hạn
5. Refresh thất bại
6. ❌ Người dùng BỊ ĐĂNG XUẤT, phải đăng nhập lại
```

## Nếu muốn tự động đăng xuất sau 15 phút không hoạt động

Để implement tính năng này, cần:

### 1. Track thời gian hoạt động cuối cùng
- Lưu timestamp của lần hoạt động cuối cùng
- Cập nhật mỗi khi có user interaction (click, scroll, keypress)

### 2. Kiểm tra thời gian không hoạt động
- Set interval để check mỗi phút
- Nếu quá 15 phút không hoạt động → Tự động đăng xuất

### 3. Clear tokens và redirect
- Xóa Access Token
- Xóa Refresh Token cookie (gọi logout API)
- Redirect về trang login

## Tóm tắt

| Token | Thời gian hết hạn | Tự động đăng xuất sau không hoạt động? |
|-------|-------------------|----------------------------------------|
| **Access Token** | 15 phút | ❌ **KHÔNG** (tự động refresh) |
| **Refresh Token** | 30 ngày | ✅ **CÓ** (sau 30 ngày) |
| **Session Token** | 7 ngày | ✅ **CÓ** (sau 7 ngày, nếu Refresh Token cũng hết hạn) |

## Kết luận

**Hiện tại:**
- ❌ **KHÔNG có** tự động đăng xuất sau 15 phút không truy cập
- ✅ Người dùng có thể quay lại sau nhiều ngày mà vẫn đăng nhập (nếu Refresh Token chưa hết hạn)
- ✅ Chỉ đăng xuất khi **Refresh Token hết hạn (30 ngày)**

**Token quyết định việc đăng xuất:**
- **Refresh Token** (30 ngày) - Token chính quyết định
- **Session Token** (7 ngày) - Token backup

**Nếu muốn tự động đăng xuất sau 15 phút không hoạt động:**
- Cần implement thêm logic track user activity
- Cần clear tokens và redirect khi detect inactivity
