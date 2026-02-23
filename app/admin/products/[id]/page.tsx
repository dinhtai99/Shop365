'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Edit } from 'lucide-react'
import { api } from '@/lib/api'
import { Product } from '@/lib/models'

export default function AdminProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string

  const [product, setProduct] = useState<Product & { images?: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [thumbnailScrollPosition, setThumbnailScrollPosition] = useState(0)
  const [user, setUser] = useState<{ role: string } | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchProduct()
    }
  }, [productId, user])
  
  // Refresh khi productId thay đổi hoặc khi window focus (để update sau khi edit từ admin panel)
  useEffect(() => {
    const handleFocus = () => {
      if (user && productId) {
        console.log('🔄 Window focused, refreshing product data...')
        fetchProduct()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, productId])

  // Keyboard navigation for images
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!product) return
      
      const mediaUrls = product.images && product.images.length > 0 
        ? product.images 
        : (product.image ? [product.image] : [])
      
      if (mediaUrls.length <= 1) return
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : mediaUrls.length - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setSelectedImageIndex((prev) => (prev < mediaUrls.length - 1 ? prev + 1 : 0))
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [product])

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

  async function fetchProduct() {
    try {
      setLoading(true)
      console.log('🔄 Fetching product ID:', productId)
      // Force fresh data để đảm bảo hiển thị đúng sau khi update
      const data = await api.products.getById(parseInt(productId), true)
      console.log('📦 Raw product data:', data)
      console.log('📸 Images array:', data.images)
      console.log('📸 Images length:', data.images?.length || 0)
      console.log('🖼️ Single image:', data.image)
      console.log('📝 Description:', data.description?.substring(0, 100))
      
      setProduct(data)
      setSelectedImageIndex(0)
      setThumbnailScrollPosition(0)
      console.log('✅ Admin Product loaded:', data.name)
      console.log('📸 Final images in state:', data.images?.length || 0, data.images)
    } catch (err: any) {
      setError(err.message || 'Không thể tải sản phẩm')
      console.error('❌ Error fetching product:', err)
    } finally {
      setLoading(false)
    }
  }

  function formatPrice(price: string | number): string {
    if (typeof price === 'string') {
      if (price.toLowerCase().includes('liên hệ') || price.toLowerCase().includes('contact')) {
        return 'Liên hệ'
      }
      const numPrice = parseFloat(price.replace(/[^\d.]/g, ''))
      if (isNaN(numPrice)) return price
      return new Intl.NumberFormat('vi-VN').format(numPrice) + ' ₫'
    }
    if (price === 0) return 'Liên hệ'
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫'
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy sản phẩm'}</p>
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Quay lại quản lý sản phẩm
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Quay lại quản lý sản phẩm</span>
              </Link>
            </div>
            <Link
              href={`/admin?editProduct=${product.id}`}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Sửa sản phẩm
            </Link>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin" className="text-gray-600 hover:text-blue-600">
              Admin
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/admin" className="text-gray-600 hover:text-blue-600">
              Quản lý sản phẩm
            </Link>
            <span className="text-gray-400">/</span>
            {product.category && (
              <>
                <span className="text-gray-600">{product.category}</span>
                <span className="text-gray-400">/</span>
              </>
            )}
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Product Images Gallery */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Main Image/Video Display with Overlay Navigation */}
            <div className="relative aspect-square bg-white flex items-center justify-center group">
              {(() => {
                const mediaUrls = product.images && product.images.length > 0 
                  ? product.images 
                  : (product.image ? [product.image] : ['/placeholder-product.jpg'])
                
                const currentMedia = mediaUrls[selectedImageIndex] || mediaUrls[0]
                const isVideo = currentMedia.includes('/videos/') || currentMedia.endsWith('.mp4') || currentMedia.endsWith('.webm') || currentMedia.endsWith('.mov')
                
                const isEmpty = !currentMedia || currentMedia === '/placeholder-product.jpg' || currentMedia === ''
                
                if (isEmpty) {
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                      <div className="text-6xl mb-4">📷</div>
                      <p className="text-lg">Chưa có hình ảnh</p>
                    </div>
                  )
                }
                
                return (
                  <>
                    {isVideo ? (
                      <div className="relative w-full h-full bg-black">
                        <video
                          src={currentMedia}
                          controls
                          className="w-full h-full object-contain"
                          playsInline
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                        <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                          <Play className="w-3 h-3" />
                          Video
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-full">
                        <Image
                          src={currentMedia}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-contain"
                          priority={selectedImageIndex === 0}
                          quality={90}
                          onError={(e) => {
                            console.error('Image load error:', currentMedia)
                            e.currentTarget.src = '/placeholder-product.jpg'
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Overlay Navigation Buttons - Only show when hover and have multiple images */}
                    {mediaUrls.length > 1 && (
                      <>
                        {/* Previous Button - Left */}
                        <button
                          onClick={() => {
                            setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : mediaUrls.length - 1))
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10 hover:scale-110"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="w-6 h-6 text-gray-800" />
                        </button>
                        
                        {/* Next Button - Right */}
                        <button
                          onClick={() => {
                            setSelectedImageIndex((prev) => (prev < mediaUrls.length - 1 ? prev + 1 : 0))
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10 hover:scale-110"
                          aria-label="Next image"
                        >
                          <ChevronRight className="w-6 h-6 text-gray-800" />
                        </button>
                        
                        {/* Image Counter - Top Right */}
                        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1.5 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {selectedImageIndex + 1} / {mediaUrls.length}
                        </div>
                      </>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Thumbnail Gallery */}
            {(() => {
              const mediaUrls = product.images && product.images.length > 0 
                ? product.images 
                : (product.image && product.image !== '/placeholder-product.jpg' ? [product.image] : [])
              
              if (mediaUrls.length <= 1) return null
              
              const thumbnailWidth = 80
              const thumbnailGap = 8
              const containerWidth = 500
              const maxVisible = Math.floor(containerWidth / (thumbnailWidth + thumbnailGap))
              const canScrollLeft = thumbnailScrollPosition > 0
              const canScrollRight = thumbnailScrollPosition < ((mediaUrls.length - maxVisible) * (thumbnailWidth + thumbnailGap))
              
              return (
                <div className="relative border-t border-gray-200 bg-white">
                  <div className="flex items-center gap-2 p-3">
                    {canScrollLeft && (
                      <button
                        onClick={() => {
                          const newPos = Math.max(0, thumbnailScrollPosition - (thumbnailWidth + thumbnailGap) * 2)
                          setThumbnailScrollPosition(newPos)
                        }}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-300 shadow-sm flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all z-10"
                        aria-label="Scroll left"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                      </button>
                    )}
                    
                    <div className="flex-1 overflow-hidden relative">
                      <div 
                        className="flex gap-2 transition-transform duration-300 ease-in-out"
                        style={{ transform: `translateX(-${thumbnailScrollPosition}px)` }}
                      >
                        {mediaUrls.map((url, index) => {
                          const isVideo = url.includes('/videos/') || url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov')
                          const isSelected = index === selectedImageIndex
                          
                          return (
                            <button
                              key={index}
                              onClick={() => {
                                setSelectedImageIndex(index)
                                const thumbPosition = index * (thumbnailWidth + thumbnailGap)
                                const centerOffset = containerWidth / 2 - thumbnailWidth / 2
                                const newScrollPos = Math.max(0, Math.min(
                                  thumbPosition - centerOffset,
                                  (mediaUrls.length - maxVisible) * (thumbnailWidth + thumbnailGap)
                                ))
                                setThumbnailScrollPosition(newScrollPos)
                              }}
                              className={`flex-shrink-0 relative w-20 h-20 rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                                isSelected 
                                  ? 'border-red-500 ring-2 ring-red-200 shadow-md scale-105' 
                                  : 'border-gray-200 hover:border-gray-400 hover:shadow-sm'
                              }`}
                            >
                              {isVideo ? (
                                <>
                                  <video
                                    src={url}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                    preload="metadata"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                    <Play className="w-5 h-5 text-white drop-shadow-lg" />
                                  </div>
                                </>
                              ) : (
                                <Image
                                  src={url}
                                  alt={`${product.name} - ${index + 1}`}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                  quality={75}
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder-product.jpg'
                                  }}
                                />
                              )}
                              {isSelected && (
                                <div className="absolute inset-0 border-2 border-red-500 rounded-md pointer-events-none" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    
                    {canScrollRight && (
                      <button
                        onClick={() => {
                          const newPos = thumbnailScrollPosition + (thumbnailWidth + thumbnailGap) * 2
                          setThumbnailScrollPosition(newPos)
                        }}
                        className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-300 shadow-sm flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all z-10"
                        aria-label="Scroll right"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

            {/* Price */}
            <div className="mb-6">
              <p className="text-4xl font-bold text-blue-600 mb-2">
                {formatPrice(product.price)}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                {product.code && (
                  <span>Mã sản phẩm: <span className="text-gray-700 font-medium">{product.code}</span></span>
                )}
                {product.category && (
                  <span>
                    Danh mục: <span className="text-gray-700 font-medium">{product.category}</span>
                  </span>
                )}
                <span>ID: <span className="text-gray-700 font-medium">#{product.id}</span></span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Mô tả sản phẩm</h3>
                <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Product Details Table */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chi tiết</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">ID Sản phẩm:</span>
                  <span className="text-gray-900 font-medium">#{product.id}</span>
                </div>
                {product.code && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Mã sản phẩm:</span>
                    <span className="text-gray-900 font-medium">{product.code}</span>
                  </div>
                )}
                {product.category && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Danh mục:</span>
                    <span className="text-gray-900 font-medium">{product.category}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Giá:</span>
                  <span className="text-gray-900 font-medium">{formatPrice(product.price)}</span>
                </div>
                {product.rating && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Đánh giá:</span>
                    <span className="text-gray-900 font-medium">{product.rating}/5 ({product.reviews || 0} đánh giá)</span>
                  </div>
                )}
                {product.images && product.images.length > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Số lượng ảnh/video:</span>
                    <span className="text-gray-900 font-medium">{product.images.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
