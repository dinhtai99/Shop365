-- SQL Server Database Schema for Shop365

-- Create Database (run this separately if database doesn't exist)
-- CREATE DATABASE Shop365;
-- GO
-- USE Shop365;
-- GO

-- Products Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND type in (N'U'))
BEGIN
    CREATE TABLE Products (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        price NVARCHAR(50) NOT NULL,
        image NVARCHAR(500) NOT NULL,
        rating INT DEFAULT 5,
        reviews INT DEFAULT 0,
        category NVARCHAR(100),
        description NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- ProductCombos Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ProductCombos]') AND type in (N'U'))
BEGIN
    CREATE TABLE ProductCombos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        image NVARCHAR(500) NOT NULL,
        price NVARCHAR(50) NULL,
        description NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- FeaturedProjects Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[FeaturedProjects]') AND type in (N'U'))
BEGIN
    CREATE TABLE FeaturedProjects (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(500) NOT NULL,
        image NVARCHAR(500) NOT NULL,
        description NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- NewsEvents Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[NewsEvents]') AND type in (N'U'))
BEGIN
    CREATE TABLE NewsEvents (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(500) NOT NULL,
        excerpt NVARCHAR(1000) NOT NULL,
        image NVARCHAR(500) NOT NULL,
        content NVARCHAR(MAX),
        date DATETIME NOT NULL,
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- Insert Sample Data
-- Products
IF NOT EXISTS (SELECT * FROM Products WHERE id = 1)
BEGIN
    INSERT INTO Products (name, price, image, rating, reviews, category) VALUES
    ('Máy xay sinh tố đa năng Sunhouse SHD5329', '1,290,000 ₫', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&h=600&fit=crop', 5, 128, 'Máy xay & Máy ép'),
    ('Nồi cơm điện tử Sharp KS-COM18EV', '2,450,000 ₫', 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=600&h=600&fit=crop', 5, 89, 'Nồi & Chảo'),
    ('Bếp từ đôi Sunhouse SHD6155', '3,890,000 ₫', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&h=600&fit=crop', 4, 156, 'Bếp & Lò'),
    ('Máy ép trái cây tốc độ chậm Kangaroo KG521', '1,950,000 ₫', 'https://images.unsplash.com/photo-1609501676725-7186f3a1d0f1?w=600&h=600&fit=crop', 5, 203, 'Máy xay & Máy ép'),
    ('Lò vi sóng Sharp R-209VN', '2,190,000 ₫', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&h=600&fit=crop', 4, 67, 'Bếp & Lò');
END
GO

-- ProductCombos
IF NOT EXISTS (SELECT * FROM ProductCombos WHERE id = 1)
BEGIN
    INSERT INTO ProductCombos (name, image, price) VALUES
    ('Combo Nhà Bếp Đầy Đủ', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&h=600&fit=crop', '8,990,000 ₫'),
    ('Combo Máy Xay & Máy Ép', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&h=600&fit=crop', '3,290,000 ₫'),
    ('Combo Làm Sạch Nhà Cửa', 'https://images.unsplash.com/photo-1609501676725-7186f3a1d0f1?w=600&h=600&fit=crop', '12,490,000 ₫');
END
GO

-- FeaturedProjects
IF NOT EXISTS (SELECT * FROM FeaturedProjects WHERE id = 1)
BEGIN
    INSERT INTO FeaturedProjects (title, image) VALUES
    ('Máy Xay Sinh Tố Đa Năng - Giải Pháp Hoàn Hảo Cho Bữa Sáng', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&h=600&fit=crop'),
    ('Nồi Cơm Điện Tử Thông Minh - Nấu Cơm Ngon Như Mẹ Nấu', 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=800&h=600&fit=crop'),
    ('Bếp Từ Đôi Hiện Đại - Nấu Nướng An Toàn Và Tiết Kiệm', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=600&fit=crop'),
    ('Robot Hút Bụi Thông Minh - Giải Phóng Thời Gian Dọn Dẹp', 'https://images.unsplash.com/photo-1609501676725-7186f3a1d0f1?w=800&h=600&fit=crop');
END
GO

-- NewsEvents
IF NOT EXISTS (SELECT * FROM NewsEvents WHERE id = 1)
BEGIN
    INSERT INTO NewsEvents (title, excerpt, image, date) VALUES
    ('CHÚC MỪNG NĂM MỚI 2026 – XUÂN BÍNH NGỌ', 'Chúc Tết đến trăm điều như ý – Mừng Xuân sang vạn sự...', 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=600&h=400&fit=crop', '2026-01-01'),
    ('KHUYẾN MÃI LỚN - Giảm Giá Đồ Gia Dụng Lên Đến 50%', 'Cơ hội vàng để sở hữu đồ gia dụng chất lượng với giá cực kỳ ưu đãi...', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&h=400&fit=crop', '2026-01-15'),
    ('Top 10 Máy Xay Sinh Tố Bán Chạy Nhất 2025', 'Tổng hợp những mẫu máy xay sinh tố được yêu thích nhất trong năm...', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&h=400&fit=crop', '2025-12-20');
END
GO
