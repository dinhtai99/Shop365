# 🧪 Unit Tests Documentation

## Tổng quan

Dự án đã được setup với Jest và React Testing Library để viết unit tests cho các phần quan trọng.

## Cấu trúc Tests

```
__tests__/
├── lib/
│   ├── api.test.ts          # Tests cho API client
│   ├── auth.test.ts         # Tests cho authentication utilities
│   └── db.test.ts           # Tests cho database utilities
├── components/
│   └── DauTrang.test.tsx    # Tests cho Header component
├── utils/
│   ├── formatPrice.test.ts  # Tests cho price formatting
│   └── validation.test.ts   # Tests cho validation utilities
└── api/
    └── orders.test.ts       # Tests cho orders API logic
```

## Chạy Tests

```bash
# Chạy tất cả tests
npm test

# Chạy tests ở watch mode
npm run test:watch

# Chạy tests với coverage report
npm run test:coverage
```

## Coverage Goals

- **Branches:** 50%
- **Functions:** 50%
- **Lines:** 50%
- **Statements:** 50%

## Test Files

### 1. `lib/api.test.ts`
Tests cho API client utility (`fetchAPI` và các API methods):
- ✅ Successful requests (GET, POST, PUT, DELETE)
- ✅ Error handling (network errors, API errors)
- ✅ Query parameters handling
- ✅ Request body serialization

### 2. `lib/auth.test.ts`
Tests cho authentication utilities:
- ✅ `getSession()` - Lấy session từ cookies
- ✅ `requireAuth()` - Yêu cầu authentication
- ✅ `requireAdmin()` - Yêu cầu ADMIN role
- ✅ `requireUser()` - Yêu cầu USER role
- ✅ `requireRole()` - Yêu cầu role cụ thể

### 3. `lib/db.test.ts`
Tests cho database utilities:
- ✅ `queryNamed()` - Named parameters conversion
- ✅ Query execution với parameters
- ✅ Error handling
- ✅ Development logging

### 4. `components/DauTrang.test.tsx`
Tests cho Header component:
- ✅ Rendering logo và navigation
- ✅ Display login/register buttons khi chưa đăng nhập
- ✅ Display user menu khi đã đăng nhập
- ✅ Fetch và display categories
- ✅ Display cart count

### 5. `utils/formatPrice.test.ts`
Tests cho price formatting utility:
- ✅ Format số thành VND currency
- ✅ Handle zero và large numbers
- ✅ Handle string input
- ✅ Format decimal numbers

### 6. `utils/validation.test.ts`
Tests cho validation utilities:
- ✅ Email validation
- ✅ Phone validation
- ✅ Required field validation
- ✅ Password strength validation

### 7. `api/orders.test.ts`
Tests cho orders API logic:
- ✅ Order code generation
- ✅ Order total calculation
- ✅ Promotion discount calculation
- ✅ Order status transitions

## Best Practices

1. **Test naming:** Mô tả rõ ràng test case làm gì
2. **Arrange-Act-Assert:** Tổ chức test theo pattern AAA
3. **Mock external dependencies:** Mock API calls, database, etc.
4. **Test edge cases:** Test cả success và error cases
5. **Keep tests simple:** Mỗi test chỉ test một thing

## Mocking

### Next.js Router
```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}))
```

### API Calls
```typescript
jest.mock('@/lib/api', () => ({
  api: {
    products: { getAll: jest.fn() },
  },
}))
```

### Fetch
```typescript
global.fetch = jest.fn()
```

## Thêm Tests Mới

Khi thêm tests mới:
1. Tạo file test trong thư mục `__tests__/` tương ứng
2. Follow naming convention: `*.test.ts` hoặc `*.test.tsx`
3. Import các utilities cần thiết
4. Mock external dependencies
5. Viết test cases với mô tả rõ ràng

## Coverage Report

Sau khi chạy `npm run test:coverage`, xem report tại:
- Console output
- `coverage/` folder (HTML report)

## Notes

- Tests chạy trong `jest-environment-jsdom` cho React components
- Tests chạy trong Node environment cho utilities
- Mock data được tạo trong mỗi test file
- Không cần database connection thật cho unit tests
