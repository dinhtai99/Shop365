/**
 * Unit tests for model interfaces and type checking
 */

import type { Product, Category, Cart, CartItem, Order, OrderItem, User, Promotion } from '@/lib/models'

describe('Model Interfaces', () => {
  describe('Product interface', () => {
    it('should have correct structure', () => {
      const product: Product = {
        id: 1,
        name: 'Test Product',
        code: 'TEST001',
        categoryId: 1,
        price: 100000,
        description: 'Test description',
        image: '/images/test.jpg',
      }

      expect(product.id).toBe(1)
      expect(product.name).toBe('Test Product')
      expect(product.price).toBe(100000)
    })
  })

  describe('Category interface', () => {
    it('should have correct structure', () => {
      const category: Category = {
        id: 1,
        name: 'Test Category',
      }

      expect(category.id).toBe(1)
      expect(category.name).toBe('Test Category')
    })
  })

  describe('Cart interface', () => {
    it('should have correct structure', () => {
      const cart: Cart = {
        id: 1,
        userId: 1,
        totalPrice: 200000,
        items: [],
      }

      expect(cart.id).toBe(1)
      expect(cart.userId).toBe(1)
      expect(cart.totalPrice).toBe(200000)
      expect(Array.isArray(cart.items)).toBe(true)
    })
  })

  describe('CartItem interface', () => {
    it('should have correct structure', () => {
      const cartItem: CartItem = {
        id: 1,
        cartId: 1,
        productId: 1,
        productName: 'Test Product',
        productCode: 'TEST001',
        productDetailId: 1,
        quantity: 2,
        unitPrice: 100000,
        totalPrice: 200000,
      }

      expect(cartItem.id).toBe(1)
      expect(cartItem.quantity).toBe(2)
      expect(cartItem.totalPrice).toBe(200000)
    })
  })

  describe('Order interface', () => {
    it('should have correct structure', () => {
      const order: Order = {
        id: 1,
        userId: 1,
        promotionId: null,
        orderCode: 'HD1234567890',
        createdAt: new Date(),
        paidAt: null,
        status: 1,
        totalPrice: 200000,
        totalPriceAfterPromotion: 180000,
      }

      expect(order.id).toBe(1)
      expect(order.status).toBe(1)
      expect(order.totalPrice).toBe(200000)
    })
  })

  describe('OrderItem interface', () => {
    it('should have correct structure', () => {
      const orderItem: OrderItem = {
        id: 1,
        orderId: 1,
        productId: 1,
        productName: 'Test Product',
        productCode: 'TEST001',
        productDetailId: 1,
        price: 100000,
        quantity: 2,
        status: 1,
      }

      expect(orderItem.id).toBe(1)
      expect(orderItem.quantity).toBe(2)
      expect(orderItem.price).toBe(100000)
    })
  })

  describe('User interface', () => {
    it('should have correct structure', () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        phone: '0987654321',
        address: '123 Test St',
        gender: 'M',
        dateOfBirth: new Date('1990-01-01'),
        role: 'USER',
        status: 1,
      }

      expect(user.id).toBe(1)
      expect(user.email).toBe('test@example.com')
      expect(user.role).toBe('USER')
    })
  })

  describe('Promotion interface', () => {
    it('should have correct structure', () => {
      const promotion: Promotion = {
        id: 1,
        code: 'DISCOUNT10',
        name: '10% Discount',
        type: 'PERCENTAGE',
        discountValue: 10,
        maxDiscount: 50000,
        minOrderAmount: 100000,
        quantity: 100,
        expiresAt: new Date('2025-12-31'),
        status: 1,
      }

      expect(promotion.id).toBe(1)
      expect(promotion.type).toBe('PERCENTAGE')
      expect(promotion.discountValue).toBe(10)
    })
  })
})
