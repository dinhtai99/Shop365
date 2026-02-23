'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Gift, Plus, Edit2, Trash2, Search, CheckCircle, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { Promotion } from '@/lib/models'

export default function AdminPromotionsPage() {
  const router = useRouter()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [searchCode, setSearchCode] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchPromotions()
    }
  }, [user])

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

  async function fetchPromotions() {
    try {
      setLoading(true)
      const data = await api.promotions.getAll()
      
      // Ensure data is an array
      const promotionsData: Promotion[] = Array.isArray(data) ? data : []
      
      let filtered: Promotion[] = promotionsData
      if (searchCode.trim()) {
        filtered = filtered.filter((promo) =>
          promo.code.toLowerCase().includes(searchCode.toLowerCase()) ||
          promo.name.toLowerCase().includes(searchCode.toLowerCase())
        )
      }

      setPromotions(filtered)
    } catch (err: any) {
      console.error('Error fetching promotions:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Bạn có chắc muốn xóa mã giảm giá này?')) return

    try {
      await api.promotions.delete(id)
      fetchPromotions()
      
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      successMsg.textContent = '✅ Đã xóa mã giảm giá!'
      document.body.appendChild(successMsg)
      setTimeout(() => {
        successMsg.remove()
      }, 3000)
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể xóa'))
    }
  }

  function formatDate(date: Date | string | undefined): string {
    if (!date) return 'Không giới hạn'
    return new Date(date).toLocaleDateString('vi-VN')
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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý mã giảm giá</h1>
          <div className="flex gap-4">
            <Link
              href="/admin/dashboard"
              className="text-gray-600 hover:text-blue-600"
            >
              Dashboard
            </Link>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm mã giảm giá
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchCode}
              onChange={(e) => {
                setSearchCode(e.target.value)
                fetchPromotions()
              }}
              placeholder="Tìm kiếm theo mã hoặc tên..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Promotions List */}
        {promotions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Chưa có mã giảm giá nào</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Thêm mã giảm giá đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{promo.name}</h3>
                    <p className="text-sm text-gray-500">Mã: <span className="font-mono font-semibold text-blue-600">{promo.code}</span></p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      promo.status === 1
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {promo.status === 1 ? (
                      <CheckCircle className="w-3 h-3 inline" />
                    ) : (
                      <XCircle className="w-3 h-3 inline" />
                    )}
                    {' '}
                    {promo.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Loại:</span>
                    <span className="font-medium text-gray-900">
                      {promo.type === 'PERCENT' || promo.type === 'PHANTRAM' ? 'Phần trăm' : 'Số tiền'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giá trị:</span>
                    <span className="font-medium text-gray-900">
                      {promo.type === 'PERCENT' || promo.type === 'PHANTRAM'
                        ? `${promo.discountValue}%`
                        : formatPrice(promo.discountValue)}
                    </span>
                  </div>
                  {promo.maxDiscount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Giảm tối đa:</span>
                      <span className="font-medium text-gray-900">{formatPrice(promo.maxDiscount)}</span>
                    </div>
                  )}
                  {promo.minOrderAmount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Đơn tối thiểu:</span>
                      <span className="font-medium text-gray-900">{formatPrice(promo.minOrderAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Số lượng:</span>
                    <span className="font-medium text-gray-900">{promo.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Hết hạn:</span>
                    <span className="font-medium text-gray-900">{formatDate(promo.expiresAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setEditingPromotion(promo)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(promo.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddForm || editingPromotion) && (
          <PromotionForm
            promotion={editingPromotion}
            onSave={async (data) => {
              try {
                if (editingPromotion) {
                  await api.promotions.update(editingPromotion.id, data)
                } else {
                  await api.promotions.create(data)
                }
                fetchPromotions()
                setShowAddForm(false)
                setEditingPromotion(null)
                
                const successMsg = document.createElement('div')
                successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
                successMsg.textContent = `✅ ${editingPromotion ? 'Đã cập nhật' : 'Đã tạo'} mã giảm giá!`
                document.body.appendChild(successMsg)
                setTimeout(() => {
                  successMsg.remove()
                }, 3000)
              } catch (err: any) {
                alert('Lỗi: ' + (err.message || 'Không thể lưu'))
              }
            }}
            onCancel={() => {
              setShowAddForm(false)
              setEditingPromotion(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

function PromotionForm({ promotion, onSave, onCancel }: { promotion: Promotion | null; onSave: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    code: promotion?.code || '',
    name: promotion?.name || '',
    type: promotion?.type || 'PERCENT',
    discountValue: promotion?.discountValue || 0,
    maxDiscount: promotion?.maxDiscount || undefined,
    minOrderAmount: promotion?.minOrderAmount || undefined,
    quantity: promotion?.quantity || 1,
    expiresAt: promotion?.expiresAt ? new Date(promotion.expiresAt).toISOString().split('T')[0] : '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      onSave({
        ...formData,
        maxDiscount: formData.maxDiscount || undefined,
        minOrderAmount: formData.minOrderAmount || undefined,
        expiresAt: formData.expiresAt || undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {promotion ? 'Chỉnh sửa mã giảm giá' : 'Thêm mã giảm giá mới'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã giảm giá <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                placeholder="GIAMGIA10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên mã giảm giá <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Giảm giá 10%"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="PERCENT">Phần trăm (%)</option>
                <option value="AMOUNT">Số tiền (₫)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá trị giảm <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder={formData.type === 'PERCENT' ? '10' : '10000'}
              />
            </div>

            {formData.type === 'PERCENT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giảm tối đa (₫)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxDiscount || ''}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || undefined })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="50000"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đơn tối thiểu (₫)
              </label>
              <input
                type="number"
                min="0"
                value={formData.minOrderAmount || ''}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hết hạn
              </label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang lưu...' : promotion ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
