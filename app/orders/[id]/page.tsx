'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, CheckCircle, XCircle, Truck, CreditCard } from 'lucide-react'
import { api } from '@/lib/api'
import { Order, OrderItem } from '@/lib/models'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = params?.id as string
  const isSuccess = searchParams?.get('success') === 'true'

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ userId: number } | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user && orderId) {
      fetchOrder()
    }
  }, [user, orderId])

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me')
      const result = await response.json()
      if (result.success) {
        setUser(result.data.user)
      } else {
        router.push('/login?redirect=/orders/' + orderId)
      }
    } catch (error) {
      router.push('/login?redirect=/orders/' + orderId)
    }
  }

  async function fetchOrder() {
    try {
      setLoading(true)
      const data = await api.orders.getById(parseInt(orderId))
      setOrder(data as Order)
    } catch (err: any) {
      setError(err.message || 'Không thể tải đơn hàng')
      console.error('Error fetching order:', err)
    } finally {
      setLoading(false)
    }
  }

  function getStatusText(status: number): { text: string; color: string; bgColor: string; icon: any } {
    switch (status) {
      case 0:
        return {
          text: 'Đã hủy',
          color: 'text-red-700',
          bgColor: 'bg-red-100',
          icon: XCircle,
        }
      case 1:
        return {
          text: 'Chờ xử lý',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-100',
          icon: Package,
        }
      case 2:
        return {
          text: 'Đang xử lý',
          color: 'text-blue-700',
          bgColor: 'bg-blue-100',
          icon: Package,
        }
      case 3:
        return {
          text: 'Đang giao hàng',
          color: 'text-purple-700',
          bgColor: 'bg-purple-100',
          icon: Truck,
        }
      case 4:
        return {
          text: 'Đã giao hàng',
          color: 'text-green-700',
          bgColor: 'bg-green-100',
          icon: CheckCircle,
        }
      default:
        return {
          text: 'Không xác định',
          color: 'text-gray-700',
          bgColor: 'bg-gray-100',
          icon: Package,
        }
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

  function formatDate(date: Date | string): string {
    if (!date) return 'N/A'
    
    // Đảm bảo date được parse đúng
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Kiểm tra nếu date không hợp lệ
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }
    
    // Format cả ngày và giờ với timezone Việt Nam
    return dateObj.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // 24h format
      timeZone: 'Asia/Ho_Chi_Minh', // Timezone Việt Nam
    })
  }

  async function handleCancelOrder() {
    if (!order || !user) return

    // Check if order can be cancelled (status < 3 means not yet shipping)
    if (order.status >= 3) {
      alert('Không thể hủy đơn hàng đã được vận chuyển. Vui lòng liên hệ với chúng tôi để được hỗ trợ.')
      return
    }

    if (order.status === 0) {
      alert('Đơn hàng này đã được hủy trước đó.')
      return
    }

    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.'
    )

    if (!confirmed) return

    try {
      setCancelling(true)
      await api.orders.cancel(order.id)
      
      // Refresh order data
      await fetchOrder()
      
      // Show success message
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      successMsg.textContent = '✅ Đã hủy đơn hàng thành công!'
      document.body.appendChild(successMsg)
      setTimeout(() => {
        successMsg.remove()
      }, 3000)
    } catch (err: any) {
      console.error('Error cancelling order:', err)
      alert('Lỗi: ' + (err.message || 'Không thể hủy đơn hàng. Vui lòng thử lại sau.'))
    } finally {
      setCancelling(false)
    }
  }

  // Check if order can be cancelled
  const canCancel = order && order.status < 3 && order.status !== 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải đơn hàng...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Đơn hàng không tồn tại'}</p>
          <Link href="/orders" className="text-blue-600 hover:text-blue-700">
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusText(order.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Message */}
      {isSuccess && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <p className="font-medium">Đặt hàng thành công! Đơn hàng của bạn đã được ghi nhận.</p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách đơn hàng
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-full ${statusInfo.bgColor}`}>
                  <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Trạng thái đơn hàng</h2>
                  <p className={`text-lg font-semibold ${statusInfo.color}`}>
                    {statusInfo.text}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Mã đơn hàng: <span className="font-medium text-gray-900">{order.orderCode}</span></p>
                <p>Ngày đặt: <span className="font-medium text-gray-900">{formatDate(order.createdAt)}</span></p>
                {order.paidAt && (
                  <p>Ngày thanh toán: <span className="font-medium text-gray-900">{formatDate(order.paidAt)}</span></p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sản phẩm</h2>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                    >
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.productName || 'Sản phẩm'}
                        </h3>
                        {item.productCode && (
                          <p className="text-sm text-gray-500 mb-2">Mã: {item.productCode}</p>
                        )}
                        <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatPrice(item.price)} / sản phẩm
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Không có sản phẩm nào</p>
              )}
            </div>
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span>{formatPrice(order.totalPrice)}</span>
                </div>
                {order.totalPriceAfterPromotion !== order.totalPrice && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span>-{formatPrice(order.totalPrice - order.totalPriceAfterPromotion)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span>Miễn phí</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatPrice(order.totalPriceAfterPromotion || order.totalPrice)}
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">Phương thức thanh toán</span>
                </div>
                <p className="text-gray-700">Thanh toán khi nhận hàng (COD)</p>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2">
                {canCancel && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {cancelling ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        <span>Đang hủy...</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Hủy đơn hàng</span>
                      </>
                    )}
                  </button>
                )}
                {order.status >= 3 && order.status !== 0 && (
                  <div className="w-full px-4 py-2 border border-gray-300 text-gray-500 rounded-lg bg-gray-50 text-center text-sm">
                    Đơn hàng đã được vận chuyển, không thể hủy
                  </div>
                )}
                <Link
                  href="/"
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
