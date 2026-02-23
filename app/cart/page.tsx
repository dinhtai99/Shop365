'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { Cart, CartItem } from '@/lib/models'

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ userId: number } | null>(null)
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set())

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchCart()
    }
  }, [user])

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me')
      const result = await response.json()
      if (result.success) {
        setUser(result.data.user)
      } else {
        router.push('/login?redirect=/cart')
      }
    } catch (error) {
      router.push('/login?redirect=/cart')
    }
  }

  async function fetchCart() {
    if (!user) return

    try {
      setLoading(true)
      const data = await api.cart.get(user.userId)
      setCart(data as Cart)
    } catch (err: any) {
      setError(err.message || 'Không thể tải giỏ hàng')
      console.error('Error fetching cart:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateQuantity(itemId: number, newQuantity: number) {
    if (newQuantity < 1) return

    setUpdatingItems((prev) => new Set(prev).add(itemId))
    try {
      await api.cart.update(itemId, newQuantity)
      await fetchCart() // Refresh cart
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể cập nhật số lượng'))
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  async function removeItem(itemId: number) {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) return

    setUpdatingItems((prev) => new Set(prev).add(itemId))
    try {
      await api.cart.remove(itemId)
      await fetchCart() // Refresh cart
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể xóa sản phẩm'))
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  function formatPrice(price: number | string): string {
    if (typeof price === 'number') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price)
    }
    return price.toString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải giỏ hàng...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Giỏ hàng trống</h2>
            <p className="text-gray-600 mb-8">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Tiếp tục mua sắm
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const totalPrice = cart.items.reduce((sum, item) => sum + item.totalPrice, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ hàng của tôi</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md p-6 flex flex-col sm:flex-row gap-4"
              >
                {/* Product Image */}
                <Link href={`/products/${item.productId}`} className="relative w-full sm:w-32 h-48 sm:h-32 flex-shrink-0">
                  <Image
                    src="/placeholder-product.jpg"
                    alt={item.productName || 'Sản phẩm'}
                    fill
                    sizes="(max-width: 640px) 100vw, 128px"
                    className="object-cover rounded-lg hover:opacity-80 transition-opacity"
                    loading="lazy"
                    quality={80}
                  />
                </Link>

                {/* Product Info */}
                <div className="flex-1">
                  <Link
                    href={`/products/${item.productId}`}
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 mb-2 block"
                  >
                    {item.productName || 'Sản phẩm'}
                  </Link>
                  {item.productCode && (
                    <p className="text-sm text-gray-500 mb-2">Mã: {item.productCode}</p>
                  )}
                  <p className="text-xl font-bold text-blue-600 mb-4">
                    {formatPrice(item.unitPrice)}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={updatingItems.has(item.id) || item.quantity <= 1}
                        className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={updatingItems.has(item.id)}
                        className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={updatingItems.has(item.id)}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Total Price */}
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Thành tiền</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatPrice(item.totalPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span>Miễn phí</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                  <Link
                    href="/checkout"
                    className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Thanh toán
                  </Link>
                <Link
                  href="/"
                  className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
