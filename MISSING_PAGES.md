# 📋 Danh Sách Màn Hình Còn Thiếu

## ✅ Đã Có (11 màn hình)
1. ✅ Trang chủ (/)
2. ✅ Chi tiết sản phẩm (/products/[id])
3. ✅ Giỏ hàng (/cart)
4. ✅ Thanh toán (/checkout)
5. ✅ Danh mục (/categories/[id])
6. ✅ Tìm kiếm (/search)
7. ✅ Trang cá nhân (/profile)
8. ✅ Đơn hàng (/orders)
9. ✅ Chi tiết đơn hàng (/orders/[id])
10. ✅ Đăng nhập (/login)
11. ✅ Đăng ký (/register)
12. ✅ Admin - Quản lý sản phẩm (/admin)

## ❌ Còn Thiếu (10 màn hình)

### 🟡 User Pages (4 màn hình)
1. ❌ Về chúng tôi (/about) - Static page
2. ❌ Liên hệ (/contact) - Cần API POST /api/contact
3. ❌ Tin tức (/news) - API có nhưng chưa có trang
4. ❌ Tin tức chi tiết (/news/[id]) - Cần API GET /api/news/[id]

### 🔵 Profile Pages (2 màn hình)
5. ❌ Quản lý địa chỉ (/profile/addresses) - Link có nhưng chưa có trang
6. ❌ Đổi mật khẩu (/profile/password) - Link có nhưng chưa có trang, cần API PUT /api/users/[id]/password

### 🔴 Admin Pages (5 màn hình)
7. ❌ Admin - Dashboard (/admin/dashboard) - Cần API thống kê
8. ❌ Admin - Quản lý đơn hàng (/admin/orders) - API có nhưng chưa có trang
9. ❌ Admin - Quản lý users (/admin/users) - API có nhưng chưa có trang
10. ❌ Admin - Quản lý khuyến mãi (/admin/promotions) - API có nhưng chưa có trang
11. ❌ Admin - Quản lý kích thước (/admin/sizes) - API có nhưng chưa có trang

---

## 📝 Ghi Chú
- Tất cả các màn hình phải gọi qua API
- API đã có sẵn cho hầu hết các màn hình
- Cần tạo API mới cho: Contact, News detail, Change password
