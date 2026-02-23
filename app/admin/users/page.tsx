'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Search, Filter, Edit2, Trash2, Shield, User as UserIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { User } from '@/lib/models'

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState<any>(null)
  const [filterRole, setFilterRole] = useState<string>('all')
  const [searchEmail, setSearchEmail] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (adminUser) {
      fetchUsers()
    }
  }, [adminUser, filterRole])

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me')
      const result = await response.json()

      if (result.success && result.data.user.role === 'ADMIN') {
        setAdminUser(result.data.user)
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    }
  }

  const [adminCount, setAdminCount] = useState(0)

  async function fetchUsers() {
    try {
      setLoading(true)
      const params: any = {}
      if (filterRole !== 'all') {
        params.role = filterRole
      }
      
      // Count admin users
      const adminResponse: User[] = await api.users.getAll({ role: 'ADMIN', activeOnly: true }) as User[]
      setAdminCount(adminResponse.length)
      if (searchEmail.trim()) {
        params.email = searchEmail
      }

      const data: User[] = await api.users.getAll(params) as User[]
      
      let filtered: User[] = data
      if (searchEmail.trim() && !params.email) {
        filtered = data.filter((user: User) =>
          user.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
          user.fullName.toLowerCase().includes(searchEmail.toLowerCase())
        )
      }

      setUsers(filtered)
    } catch (err: any) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateUser(userId: number, updates: any) {
    // Kiểm tra giới hạn admin trước khi update
    if (updates.role === 'ADMIN' && adminCount >= 2) {
      const currentUser = users.find(u => u.id === userId)
      if (currentUser && currentUser.role !== 'ADMIN') {
        alert('Đã đạt giới hạn số lượng tài khoản ADMIN (tối đa 2). Không thể tạo thêm.')
        return
      }
    }
    try {
      await api.users.update(userId, updates)
      fetchUsers()
      setEditingUser(null)
      
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      successMsg.textContent = '✅ Đã cập nhật thông tin user!'
      document.body.appendChild(successMsg)
      setTimeout(() => {
        successMsg.remove()
      }, 3000)
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể cập nhật'))
    }
  }

  async function handleDeleteUser(userId: number) {
    if (!confirm('Bạn có chắc muốn xóa user này?')) return

    try {
      await api.users.delete(userId)
      fetchUsers()
      
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      successMsg.textContent = '✅ Đã xóa user!'
      document.body.appendChild(successMsg)
      setTimeout(() => {
        successMsg.remove()
      }, 3000)
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể xóa'))
    }
  }

  function formatDate(date: Date | string | undefined): string {
    if (!date) return 'Chưa có'
    return new Date(date).toLocaleDateString('vi-VN')
  }

  if (loading || !adminUser) {
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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
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
                value={searchEmail}
                onChange={(e) => {
                  setSearchEmail(e.target.value)
                  fetchUsers()
                }}
                placeholder="Tìm kiếm theo email hoặc tên..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="ADMIN">Admin</option>
                <option value="USER">User</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {users.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Chưa có user nào</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SĐT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">#{user.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{user.email}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{user.fullName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{user.phone || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {user.role === 'ADMIN' ? (
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <UserIcon className="w-3 h-3" />
                              User
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === 1
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {user.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {user.id !== adminUser.userId && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa User</h2>
              </div>
              <EditUserForm
                user={editingUser}
                adminCount={adminCount}
                onSave={(updates) => {
                  handleUpdateUser(editingUser.id, updates)
                }}
                onCancel={() => setEditingUser(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EditUserForm({ user, onSave, onCancel, adminCount }: { user: User; onSave: (updates: any) => void; onCancel: () => void; adminCount: number }) {
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    phone: user.phone || '',
    address: user.address || '',
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    role: user.role,
    status: user.status,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Kiểm tra nếu đang cố chuyển thành admin khi đã có 2 admin
  const isTryingToBecomeAdmin = formData.role === 'ADMIN' && user.role !== 'ADMIN'
  const isAdminLimitReached = adminCount >= 2 && isTryingToBecomeAdmin

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Kiểm tra giới hạn admin
    if (isAdminLimitReached) {
      setError('Đã đạt giới hạn số lượng tài khoản ADMIN (tối đa 2). Không thể tạo thêm.')
      return
    }
    
    setSaving(true)
    setError(null)
    try {
      onSave(formData)
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {isAdminLimitReached && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          ⚠️ Đã đạt giới hạn số lượng tài khoản ADMIN (tối đa 2). Không thể chuyển user này thành ADMIN.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Chọn giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vai trò
            {adminCount >= 2 && user.role !== 'ADMIN' && (
              <span className="text-xs text-yellow-600 ml-2">(Đã đạt giới hạn 2 admin)</span>
            )}
          </label>
          <select
            value={formData.role}
            onChange={(e) => {
              const newRole = e.target.value as 'ADMIN' | 'USER'
              // Nếu đang cố chuyển thành admin khi đã có 2 admin, không cho phép
              if (newRole === 'ADMIN' && adminCount >= 2 && user.role !== 'ADMIN') {
                setError('Đã đạt giới hạn số lượng tài khoản ADMIN (tối đa 2). Không thể tạo thêm.')
                return
              }
              setError(null)
              setFormData({ ...formData, role: newRole })
            }}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              isAdminLimitReached ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            disabled={isAdminLimitReached}
          >
            <option value="USER">User</option>
            <option value="ADMIN" disabled={adminCount >= 2 && user.role !== 'ADMIN'}>
              Admin {adminCount >= 2 && user.role !== 'ADMIN' ? '(Đã đạt giới hạn)' : ''}
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
        <textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  )
}
