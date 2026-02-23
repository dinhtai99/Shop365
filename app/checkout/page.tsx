'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Truck, Gift, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { Cart, CartItem, Order } from '@/lib/models'

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<{ userId: number; fullName: string; phone?: string; address?: string } | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    paymentMethod: 'cod', // cod, bank_transfer, e_wallet
    promotionCode: '',
  })
  
  const [promotion, setPromotion] = useState<any>(null)
  const [promotionError, setPromotionError] = useState<string | null>(null)
  const [validatingPromotion, setValidatingPromotion] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user && cart) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        address: user.address || '',
        paymentMethod: 'cod',
        promotionCode: '',
      })
    }
  }, [user, cart])

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me')
      const result = await response.json()
      if (result.success) {
        setUser(result.data.user)
        await fetchCart(result.data.user.userId)
      } else {
        router.push('/login?redirect=/checkout')
      }
    } catch (error) {
      router.push('/login?redirect=/checkout')
    }
  }

  async function fetchCart(userId: number) {
    try {
      setLoading(true)
      const data = await api.cart.get(userId) as Cart
      setCart(data)
      
      if (!data || !data.items || data.items.length === 0) {
        router.push('/cart')
      }
    } catch (err: any) {
      console.error('Error fetching cart:', err)
    } finally {
      setLoading(false)
    }
  }

  async function validatePromotion() {
    if (!formData.promotionCode.trim()) {
      setPromotion(null)
      setPromotionError(null)
      return
    }

    setValidatingPromotion(true)
    setPromotionError(null)

    try {
      const totalPrice = cart?.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0
      const response = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formData.promotionCode, orderAmount: totalPrice }),
      })
      const result = await response.json()
      
      if (result.success && result.data.valid) {
        setPromotion(result.data.promotion)
        setPromotionError(null)
      } else {
        setPromotion(null)
        setPromotionError(result.data?.error || 'Mã giảm giá không hợp lệ')
      }
    } catch (err: any) {
      setPromotion(null)
      setPromotionError(err.message || 'Lỗi khi kiểm tra mã giảm giá')
    } finally {
      setValidatingPromotion(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!user || !cart) return

    // Validation
    if (!formData.fullName.trim()) {
      alert('Vui lòng nhập họ và tên')
      return
    }
    if (!formData.phone.trim()) {
      alert('Vui lòng nhập số điện thoại')
      return
    }
    if (!formData.address.trim()) {
      alert('Vui lòng nhập địa chỉ giao hàng')
      return
    }

    setSubmitting(true)
    try {
      const orderData = {
        userId: user.userId,
        cartId: cart.id,
        promotionId: promotion?.id || undefined,
      }

      console.log('Creating order with data:', orderData)
      
      const result = await api.orders.create(orderData)
      
      console.log('Order created successfully:', result)
      
      const order = result as Order
      if (order && order.id) {
        // Redirect to order success page
        router.push(`/orders/${order.id}?success=true`)
      } else {
        throw new Error('Không nhận được thông tin đơn hàng từ server')
      }
    } catch (err: any) {
      console.error('Error creating order:', err)
      
      // Show error message
      const errorMsg = document.createElement('div')
      errorMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md'
      errorMsg.innerHTML = `
        <div class="flex items-start gap-2">
          <span class="text-xl">❌</span>
          <div>
            <p class="font-bold">Lỗi đặt hàng</p>
            <p class="text-sm mt-1">${err.message || 'Không thể đặt hàng. Vui lòng thử lại sau.'}</p>
          </div>
        </div>
      `
      document.body.appendChild(errorMsg)
      setTimeout(() => {
        errorMsg.remove()
      }, 8000)
    } finally {
      setSubmitting(false)
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

  function calculateTotal() {
    if (!cart?.items) return 0
    
    const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0)
    let discount = 0
    
    if (promotion) {
      if (promotion.type === 'PERCENTAGE') {
        discount = (subtotal * promotion.discountValue) / 100
        if (promotion.maxDiscount && discount > promotion.maxDiscount) {
          discount = promotion.maxDiscount
        }
      } else if (promotion.type === 'FIXED') {
        discount = promotion.discountValue
      }
    }
    
    const shipping = 0 // Free shipping
    return Math.max(0, subtotal - discount + shipping)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Giỏ hàng trống</p>
          <button
            onClick={() => router.push('/cart')}
            className="text-blue-600 hover:text-blue-700"
          >
            Quay lại giỏ hàng
          </button>
        </div>
      </div>
    )
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0)
  const discount = promotion
    ? promotion.type === 'PERCENTAGE'
      ? Math.min((subtotal * promotion.discountValue) / 100, promotion.maxDiscount || Infinity)
      : promotion.discountValue
    : 0
  const total = Math.max(0, subtotal - discount)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Thông tin giao hàng</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Nhập họ và tên"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="0987654321"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ giao hàng <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Nhập địa chỉ chi tiết"
                    />
                  </div>
                </div>
              </div>

              {/* Promotion Code */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Mã giảm giá</h2>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.promotionCode}
                    onChange={(e) => {
                      setFormData({ ...formData, promotionCode: e.target.value })
                      setPromotion(null)
                      setPromotionError(null)
                    }}
                    onBlur={validatePromotion}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Nhập mã giảm giá"
                  />
                  <button
                    type="button"
                    onClick={validatePromotion}
                    disabled={validatingPromotion || !formData.promotionCode.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validatingPromotion ? 'Đang kiểm tra...' : 'Áp dụng'}
                  </button>
                </div>

                {promotion && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      ✅ Mã giảm giá đã được áp dụng: {promotion.name}
                    </p>
                  </div>
                )}

                {promotionError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{promotionError}</p>
                  </div>
                )}
              </div>

              {/* Payment Method - COD Only */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Phương thức thanh toán</h2>
                </div>

                <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Đơn hàng</h2>

                {/* Order Items */}
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-gray-500">x{item.quantity}</p>
                      </div>
                      <p className="text-gray-900 font-medium">
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  
                  {promotion && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá:</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span>Miễn phí</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Đặt hàng</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
