/**
 * Unit tests for API client utility
 */

import { fetchAPI, api } from '@/lib/api'

// Mock fetch globally
global.fetch = jest.fn()

describe('fetchAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Successful requests', () => {
    it('should return data on successful GET request', async () => {
      const mockData = { id: 1, name: 'Test Product' }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData }),
      })

      const result = await fetchAPI('/products/1')

      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/products/1',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      )
    })

    it('should handle POST request with body', async () => {
      const requestData = { name: 'New Product', price: 1000 }
      const responseData = { id: 1, ...requestData }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: responseData }),
      })

      const result = await fetchAPI('/products', {
        method: 'POST',
        body: JSON.stringify(requestData),
      })

      expect(result).toEqual(responseData)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should throw error when response is not ok', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        json: async () => ({ success: false, error: 'Product not found' }),
      })

      await expect(fetchAPI('/products/999')).rejects.toThrow('Product not found')
    })

    it('should throw error when success is false', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'Validation failed' }),
      })

      await expect(fetchAPI('/products')).rejects.toThrow('Validation failed')
    })

    it('should handle network errors', async () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(fetchAPI('/products')).rejects.toThrow()
      
      consoleSpy.mockRestore()
    })

    it('should handle invalid JSON response', async () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      await expect(fetchAPI('/products')).rejects.toThrow()
      
      consoleSpy.mockRestore()
    })
  })

  describe('API methods', () => {
    it('should call products.getAll correctly', async () => {
      const mockProducts = [{ id: 1, name: 'Product 1' }]
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockProducts }),
      })

      const result = await api.products.getAll()

      expect(result).toEqual(mockProducts)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/products',
        expect.any(Object)
      )
    })

    it('should call products.getAll with query params', async () => {
      const mockProducts = [{ id: 1, name: 'Product 1' }]
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockProducts }),
      })

      await api.products.getAll({ categoryId: 1, search: 'test' })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/products?categoryId=1&search=test',
        expect.any(Object)
      )
    })

    it('should call cart.add correctly', async () => {
      const cartData = { userId: 1, productDetailId: 1, quantity: 2 }
      const mockCart = { id: 1, ...cartData }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCart }),
      })

      const result = await api.cart.add(cartData)

      expect(result).toEqual(mockCart)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/cart',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(cartData),
        })
      )
    })

    it('should call orders.create correctly', async () => {
      const orderData = { userId: 1, cartId: 1, promotionId: undefined }
      const mockOrder = { id: 1, ...orderData }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockOrder }),
      })

      const result = await api.orders.create(orderData)

      expect(result).toEqual(mockOrder)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/orders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(orderData),
        })
      )
    })
  })
})
