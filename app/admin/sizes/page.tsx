'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Ruler, Plus, Edit2, Trash2, Search } from 'lucide-react'
import { api } from '@/lib/api'
import { Size } from '@/lib/models'

export default function AdminSizesPage() {
  const router = useRouter()
  const [sizes, setSizes] = useState<Size[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSize, setEditingSize] = useState<Size | null>(null)
  const [searchName, setSearchName] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchSizes()
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

  async function fetchSizes() {
    try {
      setLoading(true)
      const data = await api.sizes.getAll()
      
      // Ensure data is an array
      const sizesData: Size[] = Array.isArray(data) ? data : []
      
      let filtered: Size[] = sizesData
      if (searchName.trim()) {
        filtered = filtered.filter((size) =>
          size.name.toLowerCase().includes(searchName.toLowerCase())
        )
      }

      setSizes(filtered)
    } catch (err: any) {
      console.error('Error fetching sizes:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Bạn có chắc muốn xóa kích thước này?')) return

    try {
      await api.sizes.delete(id)
      fetchSizes()
      
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      successMsg.textContent = '✅ Đã xóa kích thước!'
      document.body.appendChild(successMsg)
      setTimeout(() => {
        successMsg.remove()
      }, 3000)
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể xóa'))
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý kích thước</h1>
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
              Thêm kích thước
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value)
                fetchSizes()
              }}
              placeholder="Tìm kiếm kích thước..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Sizes List */}
        {sizes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Ruler className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Chưa có kích thước nào</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Thêm kích thước đầu tiên
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên kích thước</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sizes.map((size) => (
                  <tr key={size.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">#{size.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{size.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingSize(size)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(size.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddForm || editingSize) && (
          <SizeForm
            size={editingSize}
            onSave={async (name) => {
              try {
                if (editingSize) {
                  await api.sizes.update(editingSize.id, name)
                } else {
                  await api.sizes.create(name)
                }
                fetchSizes()
                setShowAddForm(false)
                setEditingSize(null)
                
                const successMsg = document.createElement('div')
                successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
                successMsg.textContent = `✅ ${editingSize ? 'Đã cập nhật' : 'Đã tạo'} kích thước!`
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
              setEditingSize(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

function SizeForm({ size, onSave, onCancel }: { size: Size | null; onSave: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(size?.name || '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      alert('Vui lòng nhập tên kích thước')
      return
    }
    setSaving(true)
    try {
      onSave(name.trim())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {size ? 'Chỉnh sửa kích thước' : 'Thêm kích thước mới'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên kích thước <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ví dụ: S, M, L, XL hoặc 30cm, 40cm..."
            />
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
              {saving ? 'Đang lưu...' : size ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
