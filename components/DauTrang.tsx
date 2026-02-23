'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, Search, ShoppingCart, Phone, MapPin, User, LogOut, UserCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { getAccessToken, saveAccessToken, removeAccessToken } from '@/lib/token-storage'
import { startActivityTracking, stopActivityTracking, resetInactivityTimer } from '@/lib/activity-tracker'

interface UserSession {
  userId: number
  email: string
  role: 'ADMIN' | 'USER'
  fullName: string
}

interface Category {
  id: number
  name: string
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const lastAuthCheckRef = useRef<number>(0)
  const authCheckThrottle = 2000 // 2 seconds - chỉ check auth tối đa mỗi 2 giây

  useEffect(() => {
    // Initial check
    checkAuth()
    fetchCategories()
    
    // Check again after delays (for post-login redirect)
    const timeoutId1 = setTimeout(() => {
      checkAuth()
    }, 500)
    
    const timeoutId2 = setTimeout(() => {
      checkAuth()
    }, 1500)
    
    // Listen for token refresh event
    const handleTokenRefresh = () => {
      console.log('🔄 Header: Token refreshed event received, checking auth...')
      setTimeout(() => checkAuth(), 100)
    }
    window.addEventListener('tokenRefreshed', handleTokenRefresh)
    
    // Refresh auth when window gains focus (user might have logged in in another tab)
    const handleFocus = () => {
      const now = Date.now()
      if (now - lastAuthCheckRef.current > authCheckThrottle) {
        checkAuth()
      }
      // Reset inactivity timer khi window focus
      resetInactivityTimer()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
      window.removeEventListener('tokenRefreshed', handleTokenRefresh)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Start activity tracking khi user đã đăng nhập
  useEffect(() => {
    if (user) {
      // Start tracking activity và tự động logout sau 15 phút không hoạt động
      startActivityTracking(() => {
        console.log('🚪 Auto-logout due to inactivity (15 minutes)')
        handleLogout()
      })
      
      return () => {
        // Stop tracking khi component unmount hoặc user logout
        stopActivityTracking()
      }
    } else {
      // Stop tracking nếu user chưa đăng nhập
      stopActivityTracking()
    }
  }, [user])

  // Refresh auth when route changes (throttled)
  useEffect(() => {
    const now = Date.now()
    // Chỉ check auth nếu đã qua 2 giây kể từ lần check cuối
    if (now - lastAuthCheckRef.current > authCheckThrottle) {
      checkAuth()
    }
    
    // Reset inactivity timer khi route changes (user đang hoạt động)
    if (user) {
      resetInactivityTimer()
      fetchCartCount()
    }
  }, [pathname]) // Removed 'user' from dependencies to avoid infinite loop

  async function fetchCategories() {
    try {
      setCategoriesLoading(true)
      const data = await api.categories.getAll()
      if (Array.isArray(data)) {
        setCategories(data as Category[])
      } else {
        console.warn('⚠️ Header: Categories API returned non-array:', data)
        setCategories([]) // Set empty array as fallback
      }
    } catch (error: any) {
      console.error('❌ Header: Error fetching categories:', error)
      console.error('Error details:', error.message)
      // Set empty array to prevent crash
      setCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }

  async function fetchCartCount() {
    if (!user) return
    try {
      const cartData: any = await api.cart.get(user.userId)
      if (cartData && cartData.items && Array.isArray(cartData.items)) {
        const total = cartData.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
        setCartCount(total)
      } else {
        setCartCount(0)
      }
    } catch (error) {
      console.error('Error fetching cart count:', error)
      setCartCount(0)
    }
  }

  async function checkAuth() {
    const now = Date.now()
    
    // Throttle: chỉ check nếu đã qua 2 giây kể từ lần check cuối
    if (now - lastAuthCheckRef.current < authCheckThrottle) {
      console.log('⏭️ Header: Skipping auth check (throttled)')
      return
    }
    
    lastAuthCheckRef.current = now
    
    try {
      console.log('🔍 Header: Checking auth...')
      // Lấy access token từ memory storage
      let accessToken = getAccessToken()
      console.log('📝 Header: Access token in memory:', accessToken ? 'Có' : 'Không có')
      
      // Nếu không có token, thử refresh từ refreshToken cookie
      if (!accessToken) {
        console.log('🔄 Header: Attempting to refresh token...')
        try {
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
            cache: 'no-store',
          })
          const refreshData = await refreshResponse.json()
          console.log('🔄 Header: Refresh response:', refreshData.success ? 'Success' : refreshData.error)
          
          if (refreshData.success && refreshData.data?.accessToken) {
            accessToken = refreshData.data.accessToken
            // Lưu token vào memory
            if (accessToken) {
              saveAccessToken(accessToken)
              console.log('✅ Header: Token refreshed and saved')
            }
          } else {
            console.log('❌ Header: Refresh failed:', refreshData.error || 'Unknown error')
          }
        } catch (refreshError: any) {
          console.error('❌ Header: Refresh error:', refreshError.message)
          // Không có refresh token, tiếp tục với null token
        }
      }
      
      // Gửi request với Authorization header nếu có token
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
        console.log('📤 Header: Sending request with Authorization header')
      } else {
        console.log('📤 Header: Sending request without Authorization header (will use cookie)')
      }
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Important: include cookies (fallback)
        cache: 'no-store', // Don't cache auth checks
        headers,
      })
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        console.error('❌ Header: Auth check failed with status:', response.status)
        setUser(null)
        setLoading(false)
        return
      }
      
      const result = await response.json()
      console.log('📥 Header: Auth check response:', result.success ? 'Success' : result.error)
      
      if (result.success && result.data && result.data.user) {
        console.log('✅ Header: User authenticated:', result.data.user.email)
        setUser(result.data.user)
      } else {
        console.log('❌ Header: Not authenticated')
        setUser(null)
      }
    } catch (error: any) {
      // User not logged in or network error
      console.error('❌ Header: Auth check error:', error.message)
      console.error('Error stack:', error.stack)
      // Don't crash - just set user to null
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      console.log('🚪 Logging out...')
      
      // Stop activity tracking trước khi logout
      stopActivityTracking()
      
      // Clear access token ngay lập tức để tránh auto-refresh
      removeAccessToken()
      console.log('✅ Access token cleared from memory')
      
      // Clear user state ngay lập tức
      setUser(null)
      setIsUserMenuOpen(false)
      
      // Gọi logout API để clear cookies
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include', // Important: include cookies
        })
        console.log('✅ Logout API called successfully')
      } catch (apiError) {
        console.error('⚠️ Logout API error (but continuing):', apiError)
        // Tiếp tục logout dù API có lỗi
      }
      
      // Đợi một chút để đảm bảo state được clear
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Redirect về trang chủ
      router.push('/')
      router.refresh()
      
      // Force reload để đảm bảo tất cả state được reset
      window.location.href = '/'
    } catch (error) {
      console.error('❌ Logout error:', error)
      // Vẫn redirect dù có lỗi
      stopActivityTracking()
      removeAccessToken()
      setUser(null)
      window.location.href = '/'
    }
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100 relative">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="container mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group">
                <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Tìm showroom Gần nhất</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-blue-600">Hotline: <span className="text-gray-900">0986 085 565</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="GIA DUNG 365 PLUS"
                width={180}
                height={60}
                className="h-14 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0 flex-1 justify-center">
            {/* Container cho tất cả menu items */}
            <div className="flex items-center gap-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg">
              {/* Mega Menu - Danh mục */}
              {categories.length > 0 && (
                <div className="relative group">
                  <button className="px-5 py-2.5 text-white font-semibold text-sm transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap hover:bg-purple-600">
                    <span>Danh mục</span>
                    <span className="text-[10px] text-blue-100 group-hover:text-white transition-colors">▼</span>
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] bg-white shadow-2xl rounded-xl border-2 border-blue-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-3 z-[100] pointer-events-auto group-hover:pointer-events-auto">
                    <div className="p-6">
                      <h3 className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 text-base border-b-2 border-blue-200 pb-2">
                        Tất cả danh mục
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {categories.map((cat, idx) => (
                          <Link
                            key={cat.id}
                            href={`/categories/${cat.id}`}
                            className="block px-4 py-3 text-sm text-gray-700 bg-gray-50 hover:text-white font-medium rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 transition-all duration-300 border border-gray-200 hover:border-transparent hover:shadow-md transform hover:scale-105"
                            style={{
                              animationDelay: `${idx * 50}ms`
                            }}
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Các menu cố định - cùng màu background */}
              <Link 
                href="/#promotions" 
                className="px-5 py-2.5 text-white font-semibold text-sm transition-all duration-300 whitespace-nowrap hover:bg-purple-600 border-l border-blue-400/30"
              >
                Khuyến mãi
              </Link>
              <Link 
                href="/news" 
                className="px-5 py-2.5 text-white font-semibold text-sm transition-all duration-300 whitespace-nowrap hover:bg-purple-600 border-l border-blue-400/30"
              >
                Tin tức
              </Link>
              <Link 
                href="/about" 
                className="px-5 py-2.5 text-white font-semibold text-sm transition-all duration-300 whitespace-nowrap hover:bg-purple-600 border-l border-blue-400/30"
              >
                Giới thiệu
              </Link>
              <Link 
                href="/contact" 
                className="px-5 py-2.5 text-white font-semibold text-sm transition-all duration-300 whitespace-nowrap hover:bg-purple-600 border-l border-blue-400/30"
              >
                Liên hệ
              </Link>
            </div>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2.5 hover:bg-blue-50 rounded-lg transition-all duration-200 text-gray-600 hover:text-blue-600 hover:scale-110"
              title="Tìm kiếm"
            >
              <Search className="w-5 h-5" />
            </button>
            <Link
              href="/cart"
              className="p-2.5 hover:bg-blue-50 rounded-lg transition-all duration-200 relative text-gray-600 hover:text-blue-600 hover:scale-110"
              title="Giỏ hàng"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            
            {/* Auth Buttons */}
            {!loading && (
              <>
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                    >
                      <UserCircle className="w-5 h-5" />
                      <span className="hidden md:inline max-w-[120px] truncate">{user.fullName || user.email}</span>
                    </button>
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white shadow-2xl rounded-xl border border-gray-100 py-2 z-50 overflow-hidden">
                        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                          <p className="text-sm font-bold text-gray-900 truncate">{user.fullName}</p>
                          <p className="text-xs text-gray-600 truncate mt-0.5">{user.email}</p>
                          {user.role === 'ADMIN' && (
                            <span className="inline-block mt-2 px-2.5 py-1 text-xs bg-red-500 text-white rounded-full font-semibold shadow-sm">
                              Admin
                            </span>
                          )}
                        </div>
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors hover:text-blue-600"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          Tài khoản
                        </Link>
                        <Link
                          href="/orders"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors hover:text-blue-600"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Đơn hàng
                        </Link>
                        {user.role === 'ADMIN' && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors hover:text-blue-600 border-t border-gray-100 mt-1"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            Quản trị
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors mt-1 border-t border-gray-100"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="px-5 py-2.5 text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 rounded-lg hover:bg-blue-50 border border-gray-200 hover:border-blue-300"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      href="/register"
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                    >
                      Đăng ký
                    </Link>
                  </div>
                )}
              </>
            )}
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {isSearchOpen && (
        <div className="border-t border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="container mx-auto px-4 py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const input = e.currentTarget.querySelector('input') as HTMLInputElement
                if (input?.value.trim()) {
                  router.push(`/search?q=${encodeURIComponent(input.value.trim())}`)
                  setIsSearchOpen(false)
                }
              }}
              className="flex items-center gap-3 max-w-2xl mx-auto"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-700 placeholder-gray-400"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                Tìm kiếm
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t-2 border-blue-200 bg-white">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {/* Danh mục */}
            {categories.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent uppercase mb-3 px-2">Danh mục sản phẩm</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.id}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-3 px-4 text-gray-700 bg-gray-50 hover:text-white font-medium rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 transition-all duration-300 border border-gray-200 hover:border-transparent hover:shadow-md transform hover:scale-[1.02]"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Các menu cố định - cùng màu background */}
            <div className="pt-2 border-t-2 border-gray-200">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md overflow-hidden">
                <Link
                  href="/#promotions"
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-3 px-4 text-white font-semibold transition-all duration-300 hover:bg-purple-600 border-b border-blue-400/30"
                >
                  Khuyến mãi
                </Link>
                <Link
                  href="/news"
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-3 px-4 text-white font-semibold transition-all duration-300 hover:bg-purple-600 border-b border-blue-400/30"
                >
                  Tin tức
                </Link>
                <Link
                  href="/about"
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-3 px-4 text-white font-semibold transition-all duration-300 hover:bg-purple-600 border-b border-blue-400/30"
                >
                  Giới thiệu
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="block py-3 px-4 text-white font-semibold transition-all duration-300 hover:bg-purple-600"
                >
                  Liên hệ
                </Link>
              </div>
            </div>

            {!user && (
              <div className="pt-4 mt-4 border-t-2 border-gray-200 space-y-2">
                <Link
                  href="/login"
                  className="block py-3 px-4 text-gray-700 hover:text-blue-600 font-semibold rounded-xl hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all duration-200 text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="block py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold text-center transition-all duration-200 shadow-md hover:shadow-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
      
      {/* Click outside to close user menu */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </header>
  )
}
