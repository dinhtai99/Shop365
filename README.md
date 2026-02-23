# Nội Thất Kỳ Diệu - Website

Website bán nội thất thông minh được xây dựng với Next.js 14, React, TypeScript và Tailwind CSS.

## Tính năng

- 🏠 Trang chủ với hero section và các phần nổi bật
- 📦 Hiển thị sản phẩm và combo nội thất
- 🎨 Thiết kế responsive, hiện đại
- 📱 Tối ưu cho mobile và desktop
- ⚡ Performance cao với Next.js

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build cho production
npm run build

# Chạy production server
npm start
```

Mở [http://localhost:3000](http://localhost:3000) để xem website.

## Cấu trúc dự án

```
SHOP_365/
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Trang chủ
│   └── globals.css     # Global styles
├── components/
│   ├── Header.tsx      # Header với navigation
│   ├── Footer.tsx      # Footer
│   ├── Hero.tsx        # Hero section
│   ├── FeaturedProjects.tsx  # Dự án nổi bật
│   ├── ProductCombos.tsx     # Combo sản phẩm
│   ├── Products.tsx          # Sản phẩm
│   └── NewsEvents.tsx        # Tin tức & sự kiện
└── package.json
```

## Công nghệ sử dụng

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
