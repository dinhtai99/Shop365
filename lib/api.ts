// API Client Utility

import { getAccessToken, saveAccessToken, removeAccessToken } from './token-storage'
import { Product } from './models'
import { resetInactivityTimer } from './activity-tracker'

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: string
  headers?: Record<string, string>
  skipAuth?: boolean // Skip adding Authorization header
  csrfToken?: string // CSRF token for POST/PUT/DELETE requests
}

/**
 * Refresh access token using refresh token cookie
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    })

    const data = await response.json()

    if (data.success && data.data?.accessToken) {
      saveAccessToken(data.data.accessToken)
      return data.data.accessToken
    }

    return null
  } catch {
    return null
  }
}

export async function fetchAPI<T>(
  endpoint: string,
  options?: FetchOptions
): Promise<T> {
  // Use relative URL for same-origin requests
  const url = `/api${endpoint}`
  
  // Get access token from storage
  let accessToken = options?.skipAuth ? null : getAccessToken()
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }

  // Add Authorization header if token exists
  if (accessToken && !options?.skipAuth) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  // Add CSRF token for state-changing methods
  if (options?.csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET')) {
    headers['X-CSRF-Token'] = options.csrfToken
  }

  try {
    // Reset inactivity timer khi có API call (user đang hoạt động)
    // Chỉ reset nếu không skip auth (các API public không reset timer)
    if (!options?.skipAuth) {
      resetInactivityTimer()
    }
    
    // Cache strategy: Cache GET requests, no-cache cho POST/PUT/DELETE
    const cacheStrategy = (options?.method || 'GET') === 'GET' 
      ? 'default' // Cho phép browser cache
      : 'no-store' // Không cache cho state-changing methods

    // Override cache strategy if Cache-Control header is set
    const finalCacheStrategy = headers['Cache-Control'] === 'no-cache' 
      ? 'no-store' 
      : cacheStrategy
    
    const response = await fetch(url, {
      method: options?.method || 'GET',
      cache: finalCacheStrategy,
      headers,
      credentials: 'include', // Include cookies for authentication (fallback)
      body: options?.body,
    })
    
    // If 401 and we have a token, try to refresh
    if (response.status === 401 && accessToken && !options?.skipAuth) {
      const newToken = await refreshAccessToken()
      
      if (newToken) {
        // Retry request with new token
        headers['Authorization'] = `Bearer ${newToken}`
        const retryResponse = await fetch(url, {
          method: options?.method || 'GET',
          cache: 'no-store',
          headers,
          credentials: 'include',
          body: options?.body,
        })
        
        let retryData: any
        try {
          const retryText = await retryResponse.text()
          if (!retryText) {
            throw new Error('Empty response from server')
          }
          retryData = JSON.parse(retryText)
        } catch (parseError: any) {
          console.error(`Failed to parse JSON response from retry ${endpoint}:`, parseError)
          throw new Error('Malformed response from server. Please try again.')
        }
        
        if (!retryResponse.ok) {
          const errorMessage = retryData?.error || retryData?.message || `API Error: ${retryResponse.statusText}`
          throw new Error(errorMessage)
        }
        
        if (!retryData.success) {
          throw new Error(retryData.error || 'API request failed')
        }
        
        return retryData.data as T
      } else {
        // Refresh failed, remove token
        removeAccessToken()
      }
    }
    
    // Try to parse JSON response
    let data: any
    try {
      const text = await response.text()
      if (!text) {
        throw new Error('Empty response from server')
      }
      data = JSON.parse(text)
    } catch (parseError: any) {
      console.error(`Failed to parse JSON response from ${endpoint}:`, parseError)
      throw new Error('Malformed response from server. Please try again.')
    }
    
    if (!response.ok) {
      // If response is not ok, try to get error message from data
      const errorMessage = data?.error || data?.message || `API Error: ${response.statusText}`
      throw new Error(errorMessage)
    }
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed')
    }
    
    return data.data as T
  } catch (error: any) {
    console.error(`Error fetching ${endpoint}:`, error)
    // Re-throw with better error message
    if (error.message) {
      // Check if it's a network/connection error
      if (error.message.includes('Malformed') || error.message.includes('Failed to fetch') || error.message.includes('network')) {
        throw new Error('Lỗi kết nối đến server. Vui lòng thử lại sau.')
      }
      throw error
    }
    throw new Error(`Lỗi kết nối API: ${error.message || 'Unknown error'}`)
  }
}

// Specific API functions
export const api = {
  products: {
    getAll: (params?: { categoryId?: number; search?: string; sort?: string; page?: number; limit?: number }) => {
      const queryParams = new URLSearchParams()
      if (params?.categoryId) queryParams.append('categoryId', params.categoryId.toString())
      if (params?.search) queryParams.append('search', params.search)
      if (params?.sort) queryParams.append('sort', params.sort)
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      return fetchAPI(`/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`)
    },
    getById: (id: number, forceFresh?: boolean) => {
      const url = `/products/${id}`
      if (forceFresh) {
        // Add timestamp for cache busting
        const timestamp = Date.now()
        return fetchAPI<Product & { images?: string[] }>(`${url}?_t=${timestamp}`, { 
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        })
      }
      return fetchAPI<Product & { images?: string[] }>(url)
    },
  },
  categories: {
    getAll: () => fetchAPI('/categories'),
    getById: (id: number) => fetchAPI(`/categories/${id}`),
    create: (name: string) =>
      fetchAPI('/categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    update: (id: number, name: string) =>
      fetchAPI(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      }),
    delete: (id: number) =>
      fetchAPI(`/categories/${id}`, {
        method: 'DELETE',
      }),
  },
  cart: {
    get: (userId: number) => fetchAPI(`/cart?userId=${userId}`),
    add: (data: { userId: number; productDetailId: number; quantity: number }) =>
      fetchAPI('/cart', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (itemId: number, quantity: number) =>
      fetchAPI(`/cart/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      }),
    remove: (itemId: number) =>
      fetchAPI(`/cart/${itemId}`, {
        method: 'DELETE',
      }),
  },
  orders: {
    getAll: (userId: number) => fetchAPI(`/orders?userId=${userId}`),
    getById: (id: number) => fetchAPI(`/orders/${id}`),
    create: (data: { userId: number; cartId: number; promotionId?: number }) =>
      fetchAPI('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: { status?: number; paidAt?: string }) =>
      fetchAPI(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    cancel: (id: number) =>
      fetchAPI(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 0 }),
      }),
    delete: (id: number) =>
      fetchAPI(`/orders/${id}`, {
        method: 'DELETE',
      }),
  },
  sizes: {
    getAll: () => fetchAPI('/sizes'),
    getById: (id: number) => fetchAPI(`/sizes/${id}`),
    create: (name: string) =>
      fetchAPI('/sizes', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    update: (id: number, name: string) =>
      fetchAPI(`/sizes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      }),
    delete: (id: number) =>
      fetchAPI(`/sizes/${id}`, {
        method: 'DELETE',
      }),
  },
  promotions: {
    getAll: (activeOnly?: boolean) =>
      fetchAPI(`/promotions${activeOnly ? '?activeOnly=true' : ''}`),
    getByCode: (code: string) => fetchAPI(`/promotions?code=${code}`),
    getById: (id: number) => fetchAPI(`/promotions/${id}`),
    create: (data: {
      code: string
      name: string
      type: string
      discountValue: number
      maxDiscount?: number
      minOrderAmount?: number
      quantity?: number
      expiresAt?: string
    }) =>
      fetchAPI('/promotions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      fetchAPI(`/promotions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetchAPI(`/promotions/${id}`, {
        method: 'DELETE',
      }),
    validate: (code: string, orderAmount?: number) =>
      fetchAPI('/promotions/validate', {
        method: 'POST',
        body: JSON.stringify({ code, orderAmount }),
      }),
  },
  users: {
    getAll: (params?: { email?: string; role?: string; activeOnly?: boolean }) => {
      const queryParams = new URLSearchParams()
      if (params?.email) queryParams.append('email', params.email)
      if (params?.role) queryParams.append('role', params.role)
      if (params?.activeOnly) queryParams.append('activeOnly', 'true')
      return fetchAPI(`/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`)
    },
    getById: (id: number) => fetchAPI(`/users/${id}`),
    create: (data: {
      email: string
      password: string
      fullName: string
      gender?: string
      dateOfBirth?: string
      phone?: string
      address?: string
      role?: 'ADMIN' | 'USER'
    }) =>
      fetchAPI('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      fetchAPI(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetchAPI(`/users/${id}`, {
        method: 'DELETE',
      }),
  },
  combos: {
    getAll: () => fetchAPI('/combos'),
  },
  news: {
    getAll: () => fetchAPI('/news'),
  },
  featured: {
    getAll: () => fetchAPI('/featured'),
  },
}
