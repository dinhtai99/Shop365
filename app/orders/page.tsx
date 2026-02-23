'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Package, Search, Filter, Eye, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { Order } from '@/lib/models'

export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ userId: number } | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchCode, setSearchCode] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user, filterStatus])

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me')
      const result = await response.json()
      if (result.success) {
        setUser(result.data.user)
      } else {
        router.push('/login?redirect=/orders')
      }
    } catch (error) {
      router.push('/login?redirect=/orders')
    }
  }

  async function fetchOrders() {
    if (!user) return

    try {
      setLoading(true)
      const data = await api.orders.getAll(user.userId)
      
      // Ensure data is an array
      const ordersData: Order[] = Array.isArray(data) ? data : []
      
      // Filter orders
      let filtered: Order[] = ordersData
      
      if (filterStatus !== 'all') {
        filtered = filtered.filter((order) => {
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
        filtered = filtered.filter((order) =>
          order.orderCode.toLowerCase().includes(searchCode.toLowerCase())
        )
      }

      setOrders(filtered)
    } catch (err: any) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  function getStatusText(status: number): { text: string; color: string; bgColor: string } {
    switch (status) {
      case 0:
        return { text: 'Đã hủy', color: 'text-red-700', bgColor: 'bg-red-100' }
      case 1:
        return { text: 'Chờ xử lý', color: 'text-yellow-700', bgColor: 'bg-yellow-100' }
      case 2:
        return { text: 'Đang xử lý', color: 'text-blue-700', bgColor: 'bg-blue-100' }
      case 3:
        return { text: 'Đang giao hàng', color: 'text-purple-700', bgColor: 'bg-purple-100' }
      case 4:
        return { text: 'Đã giao hàng', color: 'text-green-700', bgColor: 'bg-green-100' }
      default:
        return { text: 'Không xác định', color: 'text-gray-700', bgColor: 'bg-gray-100' }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Đơn hàng của tôi</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
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

            {/* Status Filter */}
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

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Chưa có đơn hàng nào</h2>
            <p className="text-gray-600 mb-6">Bạn chưa có đơn hàng nào trong hệ thống</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getStatusText(order.status)
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Mã đơn: {order.orderCode}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
                        >
                          {statusInfo.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Ngày đặt: {formatDate(order.createdAt)}
                      </p>
                      {order.paidAt && (
                        <p className="text-sm text-gray-600 mb-1">
                          Ngày thanh toán: {formatDate(order.paidAt)}
                        </p>
                      )}
                      {order.items && order.items.length > 0 && (
                        <p className="text-sm text-gray-600">
                          {order.items.length} sản phẩm
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col md:items-end gap-3">
                      <div className="text-right">
                        {order.totalPriceAfterPromotion !== order.totalPrice && (
                          <p className="text-sm text-gray-500 line-through mb-1">
                            {formatPrice(order.totalPrice)}
                          </p>
                        )}
                        <p className="text-xl font-bold text-blue-600">
                          {formatPrice(order.totalPriceAfterPromotion || order.totalPrice)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {order.status < 3 && order.status !== 0 && (
                          <button
                            onClick={async () => {
                              if (confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
                                try {
                                  await api.orders.cancel(order.id)
                                  fetchOrders()
                                  alert('✅ Đã hủy đơn hàng thành công!')
                                } catch (err: any) {
                                  alert('Lỗi: ' + (err.message || 'Không thể hủy đơn hàng'))
                                }
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                          >
                            Hủy đơn
                          </button>
                        )}
                        <Link
                          href={`/orders/${order.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
