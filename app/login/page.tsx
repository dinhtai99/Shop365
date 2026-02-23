'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { saveAccessToken } from '@/lib/token-storage'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams?.get('registered') === 'true') {
      setSuccess('Đăng ký thành công! Vui lòng đăng nhập.')
    }
    if (searchParams?.get('error') === 'unauthorized') {
      setError('Bạn không có quyền truy cập trang quản trị. Chỉ quản trị viên mới được phép.')
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important: include cookies
      })

      const result = await response.json()
      console.log('📥 Login response:', result)

      if (result.success) {
        console.log('✅ Login successful!')
        console.log('👤 User:', result.data?.user)
        console.log('🔑 Access token:', result.data?.accessToken ? 'Có' : 'Không có')
        console.log('👑 User role:', result.data?.user?.role)
        
        // Lưu access token vào memory (secure storage)
        if (result.data?.accessToken) {
          saveAccessToken(result.data.accessToken)
          console.log('💾 Access token saved to memory')
        }
        
        // Small delay để đảm bảo cookies được set và token được lưu
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Redirect dựa trên role
        const userRole = result.data?.user?.role
        const redirectPath = userRole === 'ADMIN' ? '/admin' : '/'
        
        console.log('🔄 Redirecting to:', redirectPath, '(role:', userRole, ')')
        
        // Force redirect với window.location.href để đảm bảo full page reload
        // This will trigger checkAuth() in Header component
        window.location.href = redirectPath
      } else {
        // Hiển thị lỗi chi tiết hơn
        const errorMsg = result.error || 'Đăng nhập thất bại'
        console.error('❌ Login error:', errorMsg, result)
        setError(errorMsg)
      }
    } catch (err: any) {
      // Hiển thị lỗi network hoặc lỗi khác
      const errorMsg = err.message || 'Lỗi khi đăng nhập. Vui lòng kiểm tra kết nối mạng.'
      console.error('Login network error:', err)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Đăng nhập
            </h2>
            <p className="text-gray-600">
              Đăng nhập để tiếp tục mua sắm
            </p>
          </div>
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Nhập mật khẩu"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
