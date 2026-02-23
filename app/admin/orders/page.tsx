'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, Search, Filter, Eye, CheckCircle, XCircle, Truck, X, CreditCard, ShoppingCart } from 'lucide-react'

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchCode, setSearchCode] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [previousOrderStatuses, setPreviousOrderStatuses] = useState<Map<number, number>>(new Map())

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchOrders()
      
      // Auto-refresh orders mỗi 10 giây để cập nhật khi khách hàng hủy đơn
      const interval = setInterval(() => {
        fetchOrders(true) // silent refresh
      }, 10000) // 10 giây
      
      return () => clearInterval(interval)
    }
  }, [user, filterStatus])

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me')
      const result = await response.json()

      if (result.success && result.data.user.role === 'ADMIN') {
        setUser(result.data.user)
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    }
  }

  async function fetchOrders(silent: boolean = false) {
    try {
      if (!silent) {
        setLoading(true)
      }
      // Admin can see all orders - API will return all orders for admin
      const response = await fetch('/api/orders', {
        cache: 'no-store' // Đảm bảo luôn lấy data mới nhất
      })
      const result = await response.json()

      if (result.success) {
        let filtered = result.data

        if (filterStatus !== 'all') {
          filtered = filtered.filter((order: any) => {
            const status = order.status
            if (filterStatus === 'pending') return status === 1
            if (filterStatus === 'processing') return status === 2
            if (filterStatus === 'shipping') return status === 3
            if (filterStatus === 'completed') return status === 4
            if (filterStatus === 'cancelled') return status === 0
            return true
          })
        }

        if (searchCode.trim()) {
          filtered = filtered.filter((order: any) =>
            order.orderCode.toLowerCase().includes(searchCode.toLowerCase())
          )
        }

        // Kiểm tra đơn hàng nào vừa bị hủy để hiển thị thông báo
        if (!silent && previousOrderStatuses.size > 0) {
          filtered.forEach((order: any) => {
            const previousStatus = previousOrderStatuses.get(order.id)
            if (previousStatus !== undefined && previousStatus !== 0 && order.status === 0) {
              // Đơn hàng vừa bị hủy
              showNotification(`⚠️ Đơn hàng ${order.orderCode} đã bị khách hàng hủy`, 'warning')
            }
          })
        }

        // Lưu trạng thái hiện tại để so sánh lần sau
        const newStatusMap = new Map<number, number>()
        filtered.forEach((order: any) => {
          newStatusMap.set(order.id, order.status)
        })
        setPreviousOrderStatuses(newStatusMap)

        setOrders(filtered)
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  function showNotification(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-orange-500'
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md`
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-xl">${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
        <span>${message}</span>
      </div>
    `
    document.body.appendChild(notification)
    setTimeout(() => {
      notification.remove()
    }, 5000)
  }

  async function updateOrderStatus(orderId: number, newStatus: number) {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (result.success) {
        fetchOrders()
        
        const successMsg = document.createElement('div')
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        successMsg.textContent = '✅ Đã cập nhật trạng thái đơn hàng!'
        document.body.appendChild(successMsg)
        setTimeout(() => {
          successMsg.remove()
        }, 3000)
      }
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể cập nhật'))
    }
  }

  function getStatusText(status: number): { text: string; color: string; bgColor: string; icon: any } {
    switch (status) {
      case 0:
        return { text: 'Đã hủy', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle }
      case 1:
        return { text: 'Chờ xử lý', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Package }
      case 2:
        return { text: 'Đang xử lý', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Package }
      case 3:
        return { text: 'Đang giao hàng', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Truck }
      case 4:
        return { text: 'Đã giao hàng', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle }
      default:
        return { text: 'Không xác định', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: Package }
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

  async function fetchOrderDetails(orderId: number) {
    try {
      setLoadingDetails(true)
      const response = await fetch(`/api/orders/${orderId}`)
      const result = await response.json()
      
      if (result.success) {
        setOrderDetails(result.data)
        setSelectedOrder(orderId)
      }
    } catch (err: any) {
      console.error('Error fetching order details:', err)
      alert('Lỗi khi tải chi tiết đơn hàng')
    } finally {
      setLoadingDetails(false)
    }
  }

  function closeOrderDetails() {
    setSelectedOrder(null)
    setOrderDetails(null)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
          <Link
            href="/admin/dashboard"
            className="text-gray-600 hover:text-blue-600"
          >
            Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => {
                  setSearchCode(e.target.value)
                  fetchOrders()
                }}
                placeholder="Tìm kiếm theo mã đơn hàng..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="processing">Đang xử lý</option>
                <option value="shipping">Đang giao hàng</option>
                <option value="completed">Đã giao hàng</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đặt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => {
                    const statusInfo = getStatusText(order.status)
                    const StatusIcon = statusInfo.icon
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900">{order.orderCode}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          User ID: {order.userId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">
                            {formatPrice(order.totalPriceAfterPromotion || order.totalPrice)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => fetchOrderDetails(order.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết giỏ hàng và thanh toán"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {order.status === 1 && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 2)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Xác nhận đơn hàng"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {order.status === 2 && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 3)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Chuyển sang giao hàng"
                              >
                                <Truck className="w-4 h-4" />
                              </button>
                            )}
                            {order.status === 3 && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 4)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Hoàn thành đơn hàng"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {(order.status === 1 || order.status === 2) && (
                              <button
                                onClick={() => {
                                  if (confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
                                    updateOrderStatus(order.id, 0)
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hủy đơn hàng"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  Chi tiết đơn hàng
                </h2>
                <button
                  onClick={closeOrderDetails}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDetails ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang tải chi tiết...</p>
                </div>
              ) : orderDetails ? (
                <div className="p-6 space-y-6">
                  {/* Order Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Mã đơn hàng</p>
                      <p className="font-bold text-gray-900">{orderDetails.orderCode}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Ngày đặt hàng</p>
                      <p className="font-bold text-gray-900">{formatDate(orderDetails.createdAt)}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">User ID</p>
                      <p className="font-bold text-gray-900">{orderDetails.userId}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Trạng thái</p>
                      <div className="flex items-center gap-2 mt-1">
                        {(() => {
                          const statusInfo = getStatusText(orderDetails.status)
                          const StatusIcon = statusInfo.icon
                          return (
                            <>
                              <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                                {statusInfo.text}
                              </span>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      Thông tin thanh toán
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Phương thức thanh toán</p>
                        <p className="font-semibold text-gray-900">COD (Thanh toán khi nhận hàng)</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Ngày thanh toán</p>
                        <p className="font-semibold text-gray-900">
                          {orderDetails.paidAt ? formatDate(orderDetails.paidAt) : 'Chưa thanh toán'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tổng tiền</p>
                        <p className="font-bold text-lg text-gray-900">
                          {formatPrice(orderDetails.totalPrice)}
                        </p>
                      </div>
                      {orderDetails.totalPriceAfterPromotion && orderDetails.totalPriceAfterPromotion !== orderDetails.totalPrice && (
                        <div>
                          <p className="text-sm text-gray-600">Tổng sau khuyến mãi</p>
                          <p className="font-bold text-lg text-green-600">
                            {formatPrice(orderDetails.totalPriceAfterPromotion)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      Sản phẩm trong giỏ hàng ({orderDetails.items?.length || 0})
                    </h3>
                    {orderDetails.items && orderDetails.items.length > 0 ? (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã SP</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đơn giá</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {orderDetails.items.map((item: any) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <p className="font-medium text-gray-900">{item.productName}</p>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {item.productCode}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className="text-gray-900">{formatPrice(item.price)}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-gray-900 font-medium">{item.quantity}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className="font-semibold text-gray-900">
                                    {formatPrice(parseFloat(item.price) * item.quantity)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-900">
                                Tổng cộng:
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="font-bold text-lg text-blue-600">
                                  {formatPrice(orderDetails.totalPriceAfterPromotion || orderDetails.totalPrice)}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-600 text-center py-8">Không có sản phẩm nào</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-gray-600">Không thể tải chi tiết đơn hàng</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
