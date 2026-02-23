# 🔐 Middleware vs JWT - Phân Tích Hệ Thống Hiện Tại

## 📊 TÓM TẮT

**Câu trả lời ngắn gọn:** Hệ thống hiện tại dùng **CẢ HAI** - Middleware và JWT, nhưng cho các mục đích khác nhau.

---

## 🎯 MIDDLEWARE (Next.js Middleware)

### **Mục đích:**
- ✅ **Rate Limiting** - Chống brute force attacks
- ✅ **Security Headers** - Chống XSS, clickjacking, etc.
- ✅ **Request Filtering** - Apply cho tất cả requests

### **File:** `middleware.ts`

### **Chức năng:**

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // 1. Apply security headers
  applySecurityHeaders(response)
  
  // 2. Rate limiting cho login
  if (pathname === '/api/auth/login') {
    if (!checkRateLimit(`login:${ip}`, rateLimitConfigs.login)) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }
  }
  
  // 3. Rate limiting cho register
  // 4. Rate limiting cho refresh token
  // 5. Rate limiting cho API endpoints
}
```

### **Khi nào chạy:**
- ✅ **Chạy TRƯỚC** khi request đến API handler
- ✅ Apply cho **TẤT CẢ** requests (theo matcher config)
- ✅ Không cần authentication để chạy

### **Vai trò:**
- 🛡️ **First line of defense** - Bảo vệ ở network level
- 🚦 **Traffic control** - Giới hạn số lượng requests
- 🔒 **Security headers** - Thêm headers bảo mật

---

## 🔑 JWT (JSON Web Tokens)

### **Mục đích:**
- ✅ **Authentication** - Xác thực người dùng
- ✅ **Authorization** - Phân quyền (ADMIN/USER)
- ✅ **Session Management** - Quản lý phiên đăng nhập

### **Files:**
- `lib/jwt.ts` - JWT token generation/verification
- `lib/auth.ts` - Authentication middleware
- `lib/token-storage.ts` - Token storage (memory-based)

### **Chức năng:**

```typescript
// lib/jwt.ts
export async function generateAccessToken(payload: JWTPayload): Promise<string>
export async function generateRefreshToken(payload: JWTPayload): Promise<string>
export async function verifyAccessToken(token: string): Promise<JWTPayload>
export async function verifyRefreshToken(token: string): Promise<JWTPayload>

// lib/auth.ts
export async function getSession(): Promise<SessionUser | null> {
  // 1. Thử lấy token từ Authorization header
  const authHeader = headers().get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return await verifyAccessToken(token) // JWT verification
  }
  
  // 2. Fallback: Lấy từ cookie (signed session)
  const sessionCookie = cookieStore.get('session')
  return await verifySession(sessionCookie.value)
}
```

### **Khi nào chạy:**
- ✅ **Chạy TRONG** API handler
- ✅ Chỉ chạy cho các endpoints cần authentication
- ✅ Verify token signature và expiration

### **Vai trò:**
- 🔐 **Authentication** - Xác thực user identity
- 👤 **Authorization** - Kiểm tra quyền truy cập
- 📝 **Session data** - Lưu thông tin user (userId, email, role)

---

## 🔄 LUỒNG HOẠT ĐỘNG

### **1. Request Flow:**

```
User Request
    ↓
┌─────────────────────────────────┐
│  Next.js Middleware             │ ← Chạy TRƯỚC
│  - Rate limiting                │
│  - Security headers             │
│  - Request filtering            │
└──────────────┬──────────────────┘
               │
               ↓ (Nếu pass rate limit)
┌─────────────────────────────────┐
│  API Route Handler              │
│  - Parse request                │
│  - Get session (JWT)            │ ← JWT verification
│  - Verify token                 │
│  - Check authorization          │
│  - Process business logic       │
└──────────────┬──────────────────┘
               │
               ↓
         Response
```

### **2. Login Flow:**

```
User Login
    ↓
Middleware: Rate limit check ✅
    ↓
API Handler: Verify credentials ✅
    ↓
Generate JWT tokens:
  - Access Token (15 phút)
  - Refresh Token (30 ngày)
    ↓
Set cookies + Return access token
```

### **3. API Request Flow:**

```
API Request
    ↓
Middleware: 
  - Rate limit check ✅
  - Security headers ✅
    ↓
API Handler:
  - getSession() → Verify JWT ✅
  - Check authorization ✅
  - Process request ✅
```

---

## 📊 SO SÁNH

| Tiêu chí | Middleware | JWT |
|----------|------------|-----|
| **Mục đích** | Rate limiting, Security headers | Authentication, Authorization |
| **Khi nào chạy** | TRƯỚC API handler | TRONG API handler |
| **Scope** | Tất cả requests | Chỉ authenticated requests |
| **Dependencies** | Không cần auth | Cần token/session |
| **Performance** | Rất nhanh (in-memory) | Nhanh (JWT verification) |
| **State** | Stateless | Stateless (JWT) |

---

## ✅ KẾT LUẬN

### **Hệ thống hiện tại dùng:**

1. **✅ Middleware (Next.js):**
   - Rate limiting
   - Security headers
   - Request filtering

2. **✅ JWT (Authentication):**
   - Access Token (15 phút)
   - Refresh Token (30 ngày)
   - Token verification
   - Session management

### **Cả hai bổ sung cho nhau:**

- **Middleware:** Bảo vệ ở **network level** (rate limiting, headers)
- **JWT:** Bảo vệ ở **application level** (authentication, authorization)

### **Không phải "hoặc" mà là "và":**

- Middleware ≠ JWT
- Middleware = Request filtering layer
- JWT = Authentication mechanism
- **Cả hai đều cần thiết và hoạt động cùng nhau**

---

## 💡 VÍ DỤ CỤ THỂ

### **Scenario: User đăng nhập**

```
1. User POST /api/auth/login
   ↓
2. Middleware chạy:
   ✅ Check rate limit (5 attempts / 15 phút)
   ✅ Apply security headers
   ↓
3. API Handler chạy:
   ✅ Verify email/password
   ✅ Generate JWT tokens
   ✅ Set cookies
   ✅ Return access token
```

### **Scenario: User gọi API**

```
1. User GET /api/orders
   ↓
2. Middleware chạy:
   ✅ Check rate limit (100 requests / phút)
   ✅ Apply security headers
   ↓
3. API Handler chạy:
   ✅ getSession() → Verify JWT token
   ✅ Check authorization (ADMIN/USER)
   ✅ Process request
   ✅ Return data
```

---

## 🎯 TÓM TẮT

**Câu trả lời:** Hệ thống dùng **CẢ HAI**:
- **Middleware:** Cho rate limiting và security headers
- **JWT:** Cho authentication và authorization

**Không phải lựa chọn giữa hai, mà cả hai đều cần thiết và hoạt động ở các layer khác nhau.**

---

*Documentation: 2026-01-26*
