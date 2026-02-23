-- MySQL Database Schema for Shop365

-- Create Database (run this separately if database doesn't exist)
-- CREATE DATABASE Shop365 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE Shop365;

-- Products Table
CREATE TABLE IF NOT EXISTS Products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price VARCHAR(50) NOT NULL,
    image VARCHAR(500) NOT NULL,
    rating INT DEFAULT 5,
    reviews INT DEFAULT 0,
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ProductCombos Table
CREATE TABLE IF NOT EXISTS ProductCombos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image VARCHAR(500) NOT NULL,
    price VARCHAR(50) NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FeaturedProjects Table
CREATE TABLE IF NOT EXISTS FeaturedProjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    image VARCHAR(500) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NewsEvents Table
CREATE TABLE IF NOT EXISTS NewsEvents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    excerpt VARCHAR(1000) NOT NULL,
    image VARCHAR(500) NOT NULL,
    content TEXT,
    date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Sample Data
-- Products
INSERT INTO Products (name, price, image, rating, reviews, category) VALUES
('Máy xay sinh tố đa năng Sunhouse SHD5329', '1,290,000 ₫', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&h=600&fit=crop', 5, 128, 'Máy xay & Máy ép'),
('Nồi cơm điện tử Sharp KS-COM18EV', '2,450,000 ₫', 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=600&h=600&fit=crop', 5, 89, 'Nồi & Chảo'),
('Bếp từ đôi Sunhouse SHD6155', '3,890,000 ₫', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&h=600&fit=crop', 4, 156, 'Bếp & Lò'),
('Máy ép trái cây tốc độ chậm Kangaroo KG521', '1,950,000 ₫', 'https://images.unsplash.com/photo-1609501676725-7186f3a1d0f1?w=600&h=600&fit=crop', 5, 203, 'Máy xay & Máy ép'),
('Lò vi sóng Sharp R-209VN', '2,190,000 ₫', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&h=600&fit=crop', 4, 67, 'Bếp & Lò')
ON DUPLICATE KEY UPDATE name=name;

-- ProductCombos
INSERT INTO ProductCombos (name, image, price) VALUES
('Combo Nhà Bếp Đầy Đủ', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&h=600&fit=crop', '8,990,000 ₫'),
('Combo Máy Xay & Máy Ép', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&h=600&fit=crop', '3,290,000 ₫'),
('Combo Làm Sạch Nhà Cửa', 'https://images.unsplash.com/photo-1609501676725-7186f3a1d0f1?w=600&h=600&fit=crop', '12,490,000 ₫')
ON DUPLICATE KEY UPDATE name=name;

-- FeaturedProjects
INSERT INTO FeaturedProjects (title, image) VALUES
('Máy Xay Sinh Tố Đa Năng - Giải Pháp Hoàn Hảo Cho Bữa Sáng', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&h=600&fit=crop'),
('Nồi Cơm Điện Tử Thông Minh - Nấu Cơm Ngon Như Mẹ Nấu', 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=800&h=600&fit=crop'),
('Bếp Từ Đôi Hiện Đại - Nấu Nướng An Toàn Và Tiết Kiệm', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=600&fit=crop'),
('Robot Hút Bụi Thông Minh - Giải Phóng Thời Gian Dọn Dẹp', 'https://images.unsplash.com/photo-1609501676725-7186f3a1d0f1?w=800&h=600&fit=crop')
ON DUPLICATE KEY UPDATE title=title;

-- NewsEvents
INSERT INTO NewsEvents (title, excerpt, image, date) VALUES
('CHÚC MỪNG NĂM MỚI 2026 – XUÂN BÍNH NGỌ', 'Chúc Tết đến trăm điều như ý – Mừng Xuân sang vạn sự...', 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=600&h=400&fit=crop', '2026-01-01 00:00:00'),
('KHUYẾN MÃI LỚN - Giảm Giá Đồ Gia Dụng Lên Đến 50%', 'Cơ hội vàng để sở hữu đồ gia dụng chất lượng với giá cực kỳ ưu đãi...', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&h=400&fit=crop', '2026-01-15 00:00:00'),
('Top 10 Máy Xay Sinh Tố Bán Chạy Nhất 2025', 'Tổng hợp những mẫu máy xay sinh tố được yêu thích nhất trong năm...', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&h=400&fit=crop', '2025-12-20 00:00:00')
ON DUPLICATE KEY UPDATE title=title;
