// Database Models/Interfaces

export interface Product {
  id: number
  name: string
  price: string
  image: string
  rating: number
  reviews: number
  category?: string
  description?: string
  code?: string
  categoryId?: number
  productDetailId?: number // ChiTietSanPham.id for cart operations
  created_at?: Date
  updated_at?: Date
}

export interface ProductCombo {
  id: number
  name: string
  image: string
  price: string | null
  description?: string
  created_at?: Date
}

export interface FeaturedProject {
  id: number
  title: string
  image: string
  description?: string
  created_at?: Date
}

export interface NewsEvent {
  id: number
  title: string
  excerpt: string
  image: string
  content?: string
  date: Date
  created_at?: Date
}

export interface CartItem {
  id: number
  cartId: number
  productDetailId: number
  productId?: number
  productName?: string
  productCode?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: number
  addedDate?: Date
}

export interface Cart {
  id: number
  userId: number
  createdAt: Date
  totalPrice: number
  status: number
  items?: CartItem[]
}

export interface OrderItem {
  id: number
  orderId: number
  productDetailId: number
  productId?: number
  productName?: string
  productCode?: string
  price: number
  quantity: number
  status: number
}

export interface Order {
  id: number
  userId: number
  promotionId?: number
  orderCode: string
  createdAt: Date
  paidAt?: Date
  status: number
  totalPrice: number
  totalPriceAfterPromotion: number
  items?: OrderItem[]
}

export interface Size {
  id: number
  name: string
}

export interface Promotion {
  id: number
  code: string
  name: string
  type: string
  discountValue: number
  maxDiscount?: number
  minOrderAmount?: number
  quantity: number
  status: number
  createdAt: Date
  expiresAt?: Date
}

export interface Category {
  id: number
  name: string
  description?: string
  parentId?: number
  status?: number
}

export interface User {
  id: number
  email: string
  fullName: string
  gender?: string
  dateOfBirth?: Date
  phone?: string
  address?: string
  role: 'ADMIN' | 'USER'
  status: number
}
