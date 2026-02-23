'use client'

import React, { useEffect, useState, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { Product } from '@/lib/models'

interface Category {
  id: number
  name: string
}

// Export để dùng trong memoized components
export type { Category }

interface User {
  id: number
  email: string
  role: 'ADMIN' | 'USER'
  fullName: string
}

export default function AdminPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newProduct, setNewProduct] = useState({
    name: '',
    code: '',
    categoryId: '',
    price: '',
    description: '',
    image: '',
  })
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<Array<{ url: string; type: 'image' | 'video'; filename: string }>>([])
  const [editingMediaFiles, setEditingMediaFiles] = useState<Array<{ url: string; type: 'image' | 'video'; filename: string }>>([])
  const [showEditProductForm, setShowEditProductForm] = useState(false)
  const [editProduct, setEditProduct] = useState({
    id: 0,
    name: '',
    code: '',
    categoryId: '',
    price: '',
    description: '',
    image: '',
  })
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null)
  const productsPerPage = 20
  const fetchingProductsRef = React.useRef(false) // Dùng ref để track đang fetch products

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      const result = await response.json()

      if (result.success && result.data.user.role === 'ADMIN') {
        setUser(result.data.user)
        // fetchData sẽ được gọi trong useEffect khi user được set và currentPage = 1
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    }
  }, [router])

  // Fetch categories chỉ một lần
  const fetchCategories = useCallback(async () => {
    try {
      const categoriesResponse = await fetch('/api/categories', {
        cache: 'default',
      })
      const categoriesResult = await categoriesResponse.json()
      
      if (categoriesResult.success) {
        setCategories(categoriesResult.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  // Fetch products với pagination (tách riêng để optimize)
  const fetchProducts = useCallback(async (page: number) => {
    // Tránh multiple calls khi đang fetch (dùng ref thay vì state)
    if (fetchingProductsRef.current) return
    fetchingProductsRef.current = true
    
    try {
      setLoading(true)
      setMessage(null)
      
      // Fetch products với pagination - dùng stale-while-revalidate để load nhanh hơn
      const productsResponse = await fetch(`/api/products?page=${page}&limit=${productsPerPage}`, {
        cache: 'default', // Cho phép browser cache nhưng vẫn revalidate
        next: { revalidate: 30 } // Revalidate sau 30 giây
      })
      const productsResult = await productsResponse.json()
      
      if (!productsResult.success) {
        throw new Error(productsResult.error || 'Lỗi khi tải sản phẩm')
      }
      
      setProducts(productsResult.data || [])
      setPagination(productsResult.pagination || null)
      
      // Chỉ log trong development
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Đã tải ${productsResult.data?.length || 0} sản phẩm (trang ${page})`)
      }
      
      if ((productsResult.data || []).length === 0 && categories.length === 0) {
        setMessage({ 
          type: 'error', 
          text: 'Chưa có dữ liệu. Vui lòng import sản phẩm và danh mục vào database.' 
        })
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching products:', error)
      }
      setMessage({ type: 'error', text: error.message || 'Lỗi khi tải dữ liệu' })
    } finally {
      setLoading(false)
      fetchingProductsRef.current = false // Reset ref sau khi fetch xong
    }
  }, [productsPerPage, categories.length])

  // Backward compatible - fetchData vẫn hoạt động như cũ
  const fetchData = useCallback(async (page: number = currentPage) => {
    await fetchProducts(page)
  }, [currentPage, fetchProducts])

  // useEffect hooks - phải đặt sau khi các hàm được khai báo
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Fetch categories chỉ một lần khi user login
  useEffect(() => {
    if (user && categories.length === 0) {
      fetchCategories()
    }
  }, [user, categories.length]) // Loại bỏ fetchCategories khỏi dependencies

  // Fetch products khi page thay đổi - chỉ fetch khi user đã login và page thay đổi
  useEffect(() => {
    if (!user) return
    
    // Fetch ngay lập tức, không debounce để load nhanh hơn
    fetchProducts(currentPage)
  }, [currentPage, user]) // Loại bỏ fetchProducts khỏi dependencies để tránh re-render

  // Reset về trang 1 khi chọn category khác
  useEffect(() => {
    if (selectedCategoryId !== null && user && currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [selectedCategoryId, user])

  const handleUpdateProduct = useCallback(async (productId: number, field: string, value: any) => {
    if (!user || user.role !== 'ADMIN') {
      setMessage({ type: 'error', text: 'Bạn không có quyền thực hiện thao tác này' })
      return
    }

    try {
      const product = products.find((p) => p.id === productId)
      if (!product) return

      const updateData: any = {}
      if (field === 'name') {
        updateData.name = value
      } else if (field === 'categoryId') {
        updateData.categoryId = parseInt(value)
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'Cập nhật thành công!' })
        fetchData(currentPage) // Giữ nguyên trang hiện tại
        setEditingProduct(null)
      } else {
        setMessage({ type: 'error', text: result.error || 'Lỗi khi cập nhật' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi khi cập nhật' })
    }
  }, [user, products, currentPage, fetchData])

  const openEditProductForm = useCallback(async (product: Product) => {
    // Fetch full product detail để có images array
    try {
      const fullProduct = await api.products.getById(product.id, true) // Force fresh data
      console.log('📦 Opening edit form for product:', fullProduct.name)
      console.log('📸 Product images:', fullProduct.images?.length || 0, fullProduct.images)
      
      setEditProduct({
        id: fullProduct.id,
        name: fullProduct.name,
        code: fullProduct.code || '',
        categoryId: fullProduct.categoryId?.toString() || '',
        price: typeof fullProduct.price === 'string' 
          ? fullProduct.price.replace(/[^\d.]/g, '') 
          : (fullProduct.price != null ? String(fullProduct.price) : ''),
        description: fullProduct.description || '',
        image: fullProduct.image || '',
      })
      
      // Load existing media files từ images array hoặc image single
      const existingMedia: Array<{ url: string; type: 'image' | 'video'; filename: string }> = []
      
      // Ưu tiên images array nếu có
      if (fullProduct.images && Array.isArray(fullProduct.images) && fullProduct.images.length > 0) {
        fullProduct.images.forEach((url: string) => {
          if (url && url.trim() && url !== 'undefined' && url !== 'null') {
            const isVideo = url.includes('/videos/') || url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov')
            existingMedia.push({
              url: url.trim(),
              type: isVideo ? 'video' : 'image',
              filename: url.split('/').pop() || '',
            })
          }
        })
      } else if (fullProduct.image && fullProduct.image.trim() && fullProduct.image !== 'undefined') {
        // Fallback to single image
        existingMedia.push({
          url: fullProduct.image.trim(),
          type: 'image',
          filename: fullProduct.image.split('/').pop() || '',
        })
      }
      
      console.log('📸 Loaded existing media files:', existingMedia.length, existingMedia.map(f => f.url))
      setEditingMediaFiles(existingMedia)
      setShowEditProductForm(true)
      setEditingProduct(null)
    } catch (error: any) {
      console.error('Error loading product detail:', error)
      setMessage({ type: 'error', text: 'Không thể tải chi tiết sản phẩm: ' + error.message })
    }
  }, [])

  async function handleEditMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Validate files (same as handleMediaUpload)
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes]

    const maxImageSize = 5 * 1024 * 1024 // 5MB
    const maxVideoSize = 50 * 1024 * 1024 // 50MB

    const filesArray = Array.from(files)
    const invalidFiles = filesArray.filter(file => {
      const isVideo = file.type.startsWith('video/')
      const maxSize = isVideo ? maxVideoSize : maxImageSize
      return !allowedTypes.includes(file.type) || file.size > maxSize
    })

    if (invalidFiles.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `Một số file không hợp lệ. Ảnh: tối đa 5MB, Video: tối đa 50MB` 
      })
      return
    }

    try {
      setUploadingMedia(true)
      const formData = new FormData()
      
      filesArray.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        const uploadedFiles = result.data.files || [result.data]
        
        const newMediaFiles = uploadedFiles.map((file: any) => ({
          url: file.url,
          type: file.type || (file.url.includes('/videos/') ? 'video' : 'image'),
          filename: file.filename || file.url.split('/').pop(),
        }))

        setEditingMediaFiles(prev => [...prev, ...newMediaFiles])
        
        // Update product image field with first image URL
        const firstImage = newMediaFiles.find((f: any) => f.type === 'image')
        if (firstImage) {
          setEditProduct({ ...editProduct, image: firstImage.url })
        }

        setMessage({ 
          type: 'success', 
          text: `Upload thành công ${newMediaFiles.length} file!` 
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'Lỗi khi upload file' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi khi upload file' })
    } finally {
      setUploadingMedia(false)
      e.target.value = ''
    }
  }

  function removeEditMediaFile(index: number) {
    const newFiles = editingMediaFiles.filter((_, i) => i !== index)
    setEditingMediaFiles(newFiles)
    
    const firstImage = newFiles.find(f => f.type === 'image')
    setEditProduct({ ...editProduct, image: firstImage?.url || '' })
  }

  async function handleSaveEditProduct() {
    if (!user || user.role !== 'ADMIN') {
      setMessage({ type: 'error', text: 'Bạn không có quyền thực hiện thao tác này' })
      return
    }

    if (!editProduct.name.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên sản phẩm' })
      return
    }

    // Prepare images array
    const imagesToSave = editingMediaFiles.map(f => f.url).filter(url => url && url.trim())
    console.log('💾 Saving product:', editProduct.name)
    console.log('📸 Images to save:', imagesToSave.length, imagesToSave)
    console.log('📝 Description:', editProduct.description?.substring(0, 100) || '(empty)')

    try {
      const requestBody = {
        name: editProduct.name,
        code: editProduct.code || `SP${Date.now()}`,
        categoryId: editProduct.categoryId ? parseInt(editProduct.categoryId) : null,
        price: editProduct.price ? parseFloat(editProduct.price.replace(/[^\d.]/g, '')) : 0,
        description: editProduct.description || '',
        image: editProduct.image || '',
        images: imagesToSave, // Send all media URLs
      }
      
      console.log('📤 PUT Request body:', JSON.stringify(requestBody, null, 2))

      const response = await fetch(`/api/products/${editProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()
      console.log('📥 PUT Response:', result)
      console.log('📥 PUT Response data:', result.data)
      console.log('📥 PUT Response images:', result.data?.images)
      console.log('📥 PUT Response images length:', result.data?.images?.length || 0)

      if (result.success) {
        setMessage({ type: 'success', text: `Cập nhật sản phẩm "${editProduct.name}" thành công!` })
        setShowEditProductForm(false)
        setEditingMediaFiles([])
        
        // Check if we're on product detail page - refresh it
        if (window.location.pathname.startsWith('/admin/products/')) {
          console.log('🔄 Refreshing product detail page...')
          window.location.reload()
        } else {
          // Refresh data và đợi một chút để cache được clear
          await new Promise(resolve => setTimeout(resolve, 500))
          fetchData(currentPage) // Giữ nguyên trang hiện tại
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Lỗi khi cập nhật sản phẩm' })
      }
    } catch (error: any) {
      console.error('❌ Error saving product:', error)
      setMessage({ type: 'error', text: error.message || 'Lỗi khi cập nhật sản phẩm' })
    }
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Validate files
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes]

    const maxImageSize = 5 * 1024 * 1024 // 5MB
    const maxVideoSize = 50 * 1024 * 1024 // 50MB

    const filesArray = Array.from(files)
    const invalidFiles = filesArray.filter(file => {
      const isVideo = file.type.startsWith('video/')
      const maxSize = isVideo ? maxVideoSize : maxImageSize
      return !allowedTypes.includes(file.type) || file.size > maxSize
    })

    if (invalidFiles.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `Một số file không hợp lệ. Ảnh: tối đa 5MB, Video: tối đa 50MB` 
      })
      return
    }

    try {
      setUploadingMedia(true)
      const formData = new FormData()
      
      // Append all files
      filesArray.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        // Handle both single file (backward compatible) and multiple files
        const uploadedFiles = result.data.files || [result.data]
        
        const newMediaFiles = uploadedFiles.map((file: any) => ({
          url: file.url,
          type: file.type || (file.url.includes('/videos/') ? 'video' : 'image'),
          filename: file.filename || file.url.split('/').pop(),
        }))

        setMediaFiles(prev => [...prev, ...newMediaFiles])
        
        // Update product image field with first image URL (backward compatible)
        const firstImage = newMediaFiles.find((f: any) => f.type === 'image')
        if (firstImage) {
          setNewProduct({ ...newProduct, image: firstImage.url })
        }

        setMessage({ 
          type: 'success', 
          text: `Upload thành công ${newMediaFiles.length} file!` 
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'Lỗi khi upload file' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi khi upload file' })
    } finally {
      setUploadingMedia(false)
      // Reset input để có thể chọn lại cùng file
      e.target.value = ''
    }
  }

  function removeMediaFile(index: number) {
    const newFiles = mediaFiles.filter((_, i) => i !== index)
    setMediaFiles(newFiles)
    
    // Update product image field
    const firstImage = newFiles.find(f => f.type === 'image')
    setNewProduct({ ...newProduct, image: firstImage?.url || '' })
  }

  async function handleAddProduct() {
    if (!user || user.role !== 'ADMIN') {
      setMessage({ type: 'error', text: 'Bạn không có quyền thực hiện thao tác này' })
      return
    }

    if (!newProduct.name.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên sản phẩm' })
      return
    }

    if (!newProduct.price.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập giá sản phẩm' })
      return
    }

    if (!newProduct.categoryId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn danh mục' })
      return
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProduct.name,
          code: newProduct.code || `SP${Date.now()}`,
          categoryId: parseInt(newProduct.categoryId),
          price: parseFloat(newProduct.price.replace(/[^\d.]/g, '')),
          description: newProduct.description || '',
          image: newProduct.image || '',
          images: mediaFiles.map(f => f.url), // Send all media URLs
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Sản phẩm đã được thêm vào database:', result.data)
        setMessage({ type: 'success', text: `Thêm sản phẩm "${result.data?.name || newProduct.name}" thành công!` })
        setNewProduct({
          name: '',
          code: '',
          categoryId: '',
          price: '',
          description: '',
          image: '',
        })
        setMediaFiles([])
        setShowAddProduct(false)
        
        // Reset về trang đầu tiên sau khi thêm sản phẩm mới
        setCurrentPage(1)
        await fetchData(1)
        
        // Also refresh after a delay to ensure database is fully updated
        setTimeout(async () => {
          await fetchData(1)
        }, 1000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Lỗi khi thêm sản phẩm' })
        console.error('❌ Error adding product:', result)
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi khi thêm sản phẩm' })
      console.error('❌ Exception when adding product:', error)
    }
  }

  async function handleAddCategory() {
    if (!user || user.role !== 'ADMIN') {
      setMessage({ type: 'error', text: 'Bạn không có quyền thực hiện thao tác này' })
      return
    }

    if (!newCategoryName.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên danh mục' })
      return
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategoryName }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: `Thêm danh mục "${result.data?.name || newCategoryName}" thành công!` })
        setNewCategoryName('')
        setShowAddCategory(false)
        // Refresh data after a short delay to ensure database is updated
        setTimeout(() => {
          fetchData(currentPage) // Giữ nguyên trang hiện tại
        }, 500)
      } else {
        setMessage({ type: 'error', text: result.error || 'Lỗi khi thêm danh mục' })
        console.error('Error adding category:', result)
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi khi thêm danh mục' })
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      router.push('/login')
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

  // Kiểm tra role ngay lập tức và redirect nếu không phải ADMIN
  if (user.role !== 'ADMIN') {
    // Redirect ngay lập tức thay vì chỉ hiển thị message
    router.push('/login?error=unauthorized')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-red-600 mb-4">Bạn không có quyền truy cập trang này. Đang chuyển hướng...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
            <p className="text-sm text-gray-600 mt-1">
              Xin chào, {user.fullName} ({user.email})
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/dashboard"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/orders"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Đơn hàng
            </Link>
            <Link
              href="/admin/users"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Users
            </Link>
            <Link
              href="/admin/promotions"
              className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition"
            >
              Khuyến mãi
            </Link>
            <Link
              href="/admin/sizes"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
            >
              Kích thước
            </Link>
            <button
              onClick={() => {
                setShowAddProduct(!showAddProduct)
                setShowAddCategory(false)
              }}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
            >
              {showAddProduct ? 'Hủy' : '+ Thêm sản phẩm'}
            </button>
            <button
              onClick={() => {
                setShowAddCategory(!showAddCategory)
                setShowAddProduct(false)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {showAddCategory ? 'Hủy' : '+ Thêm danh mục'}
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>

          {message && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {showAddProduct && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-teal-200">
              <h2 className="text-xl font-semibold mb-4 text-teal-800">Thêm sản phẩm mới</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Nhập tên sản phẩm"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mã sản phẩm</label>
                  <input
                    type="text"
                    value={newProduct.code}
                    onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                    placeholder="Tự động tạo nếu để trống"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="Ví dụ: 1000000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Nhập mô tả sản phẩm"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh & Video sản phẩm (có thể chọn nhiều)
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleMediaUpload}
                      disabled={uploadingMedia}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="text-xs text-gray-500">
                      📸 Ảnh: tối đa 5MB mỗi file | 🎥 Video: tối đa 50MB mỗi file
                    </div>
                    {uploadingMedia && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Đang upload...</span>
                      </div>
                    )}
                    {mediaFiles.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {mediaFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            {file.type === 'image' ? (
                              <img
                                src={file.url}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-300"
                              />
                            ) : (
                              <video
                                src={file.url}
                                className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                controls={false}
                              >
                                Your browser does not support the video tag.
                              </video>
                            )}
                            <button
                              type="button"
                              onClick={() => removeMediaFile(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600"
                              title="Xóa file"
                            >
                              ×
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                              {file.type === 'video' ? '🎥' : '📸'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      Hoặc nhập URL ảnh (chỉ ảnh đầu tiên):
                      <input
                        type="text"
                        value={newProduct.image}
                        onChange={(e) => {
                          setNewProduct({ ...newProduct, image: e.target.value })
                          // Update mediaFiles if URL is provided
                          if (e.target.value && !mediaFiles.some(f => f.url === e.target.value)) {
                            setMediaFiles([{ url: e.target.value, type: 'image', filename: '' }])
                          }
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleAddProduct}
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition font-semibold"
                >
                  Thêm sản phẩm
                </button>
                <button
                  onClick={() => {
                    setShowAddProduct(false)
                    setNewProduct({
                      name: '',
                      code: '',
                      categoryId: '',
                      price: '',
                      description: '',
                      image: '',
                    })
                    setMediaFiles([])
                  }}
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {showAddCategory && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Thêm danh mục mới</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Tên danh mục"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCategory()
                    }
                  }}
                />
                <button
                  onClick={handleAddCategory}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Thêm
                </button>
              </div>
            </div>
          )}

          {/* Form sửa sản phẩm đầy đủ */}
          {showEditProductForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-teal-800">Sửa sản phẩm</h2>
                    <button
                      onClick={() => {
                        setShowEditProductForm(false)
                        setEditingMediaFiles([])
                      }}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên sản phẩm *
                      </label>
                      <input
                        type="text"
                        value={editProduct.name}
                        onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Nhập tên sản phẩm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mã sản phẩm
                      </label>
                      <input
                        type="text"
                        value={editProduct.code}
                        onChange={(e) => setEditProduct({ ...editProduct, code: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Nhập mã sản phẩm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Danh mục *
                      </label>
                      <select
                        value={editProduct.categoryId}
                        onChange={(e) => setEditProduct({ ...editProduct, categoryId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá *
                      </label>
                      <input
                        type="text"
                        value={editProduct.price}
                        onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Nhập giá sản phẩm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả
                      </label>
                      <textarea
                        value={editProduct.description}
                        onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                        placeholder="Nhập mô tả sản phẩm"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hình ảnh & Video sản phẩm (có thể chọn nhiều)
                      </label>
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={handleEditMediaUpload}
                          disabled={uploadingMedia}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div className="text-xs text-gray-500">
                          📸 Ảnh: tối đa 5MB mỗi file | 🎥 Video: tối đa 50MB mỗi file
                        </div>
                        {uploadingMedia && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>Đang upload...</span>
                          </div>
                        )}
                        {editingMediaFiles.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {editingMediaFiles.map((file, index) => (
                              <div key={index} className="relative group">
                                {file.type === 'image' ? (
                                  <img
                                    src={file.url}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                  />
                                ) : (
                                  <video
                                    src={file.url}
                                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                                    controls={false}
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeEditMediaFile(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600"
                                  title="Xóa file"
                                >
                                  ×
                                </button>
                                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                  {file.type === 'video' ? '🎥' : '📸'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          Hoặc nhập URL ảnh (chỉ ảnh đầu tiên):
                          <input
                            type="text"
                            value={editProduct.image}
                            onChange={(e) => {
                              setEditProduct({ ...editProduct, image: e.target.value })
                              if (e.target.value && !editingMediaFiles.some(f => f.url === e.target.value)) {
                                setEditingMediaFiles([{ url: e.target.value, type: 'image', filename: '' }])
                              }
                            }}
                            placeholder="https://example.com/image.jpg"
                            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleSaveEditProduct}
                      className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition font-semibold"
                    >
                      Lưu thay đổi
                    </button>
                    <button
                      onClick={() => {
                        setShowEditProductForm(false)
                        setEditingMediaFiles([])
                      }}
                      className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hiển thị danh sách danh mục */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Danh sách danh mục ({categories.length})</h2>
            {categories.length > 0 ? (
              <CategoryList 
                categories={categories}
                products={products}
                selectedCategoryId={selectedCategoryId}
                setSelectedCategoryId={setSelectedCategoryId}
              />
            ) : (
              <p className="text-gray-500">Chưa có danh mục nào</p>
            )}
          </div>

          {/* Hiển thị sản phẩm theo danh mục đã chọn */}
          {selectedCategoryId ? (
            <CategoryProducts 
              products={products}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              editingProduct={editingProduct}
              setEditingProduct={setEditingProduct}
              handleUpdateProduct={handleUpdateProduct}
              openEditProductForm={openEditProductForm}
              pagination={pagination}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              productsPerPage={productsPerPage}
              loading={loading}
              setMessage={setMessage}
            />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-2 text-lg">Vui lòng chọn một danh mục để xem sản phẩm</p>
              <p className="text-sm text-gray-400">
                Click vào một trong {categories.length} danh mục ở trên để xem sản phẩm
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Memoized component cho category list - tối ưu performance
const CategoryList = memo(({ 
  categories, 
  products, 
  selectedCategoryId, 
  setSelectedCategoryId 
}: {
  categories: Category[]
  products: Product[]
  selectedCategoryId: number | null
  setSelectedCategoryId: (id: number) => void
}) => {
  // Tính toán product counts một lần với useMemo
  const categoryCounts = useMemo(() => {
    const counts = new Map<number, number>()
    products.forEach(p => {
      if (p.categoryId) {
        counts.set(p.categoryId, (counts.get(p.categoryId) || 0) + 1)
      }
    })
    return counts
  }, [products])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((cat) => {
        const productCount = categoryCounts.get(cat.id) || 0
        const isSelected = selectedCategoryId === cat.id
        return (
          <div
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`bg-gray-50 p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
              isSelected 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900">ID: {cat.id}</p>
                <p className="text-gray-700">{cat.name}</p>
              </div>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                isSelected 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {productCount} SP
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
})

CategoryList.displayName = 'CategoryList'

// Memoized component để hiển thị products theo category
const CategoryProducts = memo(({ 
  products, 
  categories, 
  selectedCategoryId,
  editingProduct,
  setEditingProduct,
  handleUpdateProduct,
  openEditProductForm,
  pagination,
  currentPage,
  setCurrentPage,
  productsPerPage,
  loading,
  setMessage
}: {
  products: Product[]
  categories: Category[]
  selectedCategoryId: number
  editingProduct: Product | null
  setEditingProduct: (product: Product | null) => void
  handleUpdateProduct: (productId: number, field: string, value: any) => Promise<void>
  openEditProductForm: (product: Product) => Promise<void>
  pagination: { page: number; limit: number; total: number; totalPages: number } | null
  currentPage: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  productsPerPage: number
  loading: boolean
  setMessage: (message: { type: 'success' | 'error'; text: string } | null) => void
}) => {
  // Memoize filtered products để tránh tính toán lại mỗi lần render
  const filteredProducts = useMemo(() => 
    products.filter(p => p.categoryId === selectedCategoryId),
    [products, selectedCategoryId]
  )
  
  const selectedCategory = useMemo(() => 
    categories.find(c => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  )

  return (
    <div className="overflow-x-auto">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-blue-600">
          Sản phẩm của danh mục: <span className="font-bold">{selectedCategory?.name}</span> ({filteredProducts.length} sản phẩm)
        </h2>
      </div>
      {filteredProducts.length > 0 ? (
        <>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left">ID</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Tên sản phẩm</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Danh mục</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Giá</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3">{product.id}</td>
                  <td className="border border-gray-300 px-4 py-3">
                    {editingProduct?.id === product.id ? (
                      <input
                        type="text"
                        defaultValue={product.name}
                        onBlur={(e) => {
                          if (e.target.value !== product.name) {
                            handleUpdateProduct(product.id, 'name', e.target.value)
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur()
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {product.name}
                        </Link>
                        <span
                          className="cursor-pointer text-gray-400 hover:text-gray-600 text-xs"
                          onClick={() => setEditingProduct(product)}
                          title="Click để sửa nhanh"
                        >
                          ✏️
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {editingProduct?.id === product.id ? (
                      <select
                        defaultValue={product.categoryId || ''}
                        onChange={(e) => {
                          handleUpdateProduct(product.id, 'categoryId', e.target.value)
                          setEditingProduct(null)
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="cursor-pointer hover:text-blue-600"
                        onClick={() => setEditingProduct(product)}
                      >
                        {product.category || 'Chưa có danh mục'}
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {typeof product.price === 'string' ? product.price : `${product.price} ₫`}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-purple-600 hover:text-purple-800 font-medium hover:underline flex items-center gap-1"
                      >
                        👁️ Xem chi tiết
                      </Link>
                      <Link
                        href={`/products/${product.id}`}
                        target="_blank"
                        className="text-gray-500 hover:text-gray-700 text-xs hover:underline flex items-center gap-1"
                        title="Xem trang user (mở tab mới)"
                      >
                        👤 User view
                      </Link>
                      <button
                        onClick={() =>
                          setEditingProduct(editingProduct?.id === product.id ? null : product)
                        }
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {editingProduct?.id === product.id ? 'Hủy' : 'Sửa nhanh'}
                      </button>
                      <button
                        onClick={() => {
                          openEditProductForm(product).catch(err => {
                            console.error('Error opening edit form:', err)
                            setMessage({ type: 'error', text: 'Lỗi khi mở form sửa: ' + err.message })
                          })
                        }}
                        className="text-green-600 hover:text-green-800 font-medium"
                      >
                        Sửa đầy đủ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Hiển thị {(currentPage - 1) * productsPerPage + 1} - {Math.min(currentPage * productsPerPage, pagination.total)} / {pagination.total} sản phẩm
              </div>
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    currentPage === 1 || loading
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Trước
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {useMemo(() => {
                    const pages: number[] = []
                    const totalPages = pagination.totalPages
                    
                    if (totalPages <= 5) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i)
                    } else if (currentPage <= 3) {
                      for (let i = 1; i <= 5; i++) pages.push(i)
                    } else if (currentPage >= totalPages - 2) {
                      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
                    } else {
                      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i)
                    }
                    return pages
                  }, [currentPage, pagination.totalPages]).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage((prev: number) => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages || loading}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    currentPage === pagination.totalPages || loading
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  Sau
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-2">Danh mục này chưa có sản phẩm nào</p>
          <p className="text-sm text-gray-400">
            Click vào danh mục khác hoặc thêm sản phẩm mới
          </p>
        </div>
      )}
    </div>
  )
})

CategoryProducts.displayName = 'CategoryProducts'
