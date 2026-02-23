'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ShoppingCart, ArrowLeft, Plus, Minus, Heart, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { api } from '@/lib/api'
import { Product } from '@/lib/models'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string

  const [product, setProduct] = useState<Product & { images?: string[] } | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const [user, setUser] = useState<{ userId: number } | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [thumbnailScrollPosition, setThumbnailScrollPosition] = useState(0)

  useEffect(() => {
    checkAuth()
    fetchProduct()
    fetchRelatedProducts()
  }, [productId])

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
      if (result.success) {
        setUser(result.data.user)
      }
    } catch (error) {
      // User not logged in
    }
  }

  async function fetchProduct() {
    try {
      setLoading(true)
      // Force fresh data - không dùng cache khi fetch product detail
      const data = await api.products.getById(parseInt(productId), true) // Force fresh data
      setProduct(data)
      // Reset selected image khi load product mới
      setSelectedImageIndex(0)
      setThumbnailScrollPosition(0)
      console.log('✅ Product loaded:', data.name)
      console.log('📸 Images:', data.images?.length || 0, data.images)
      console.log('🖼️ Single image:', data.image)
    } catch (err: any) {
      setError(err.message || 'Không thể tải sản phẩm')
      console.error('Error fetching product:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchRelatedProducts() {
    try {
      const allProducts = await api.products.getAll() as Product[]
      // Filter related products (same category, exclude current)
      const related = allProducts
        .filter((p) => p.categoryId === product?.categoryId && p.id !== product?.id)
        .slice(0, 4)
      setRelatedProducts(related)
    } catch (err) {
      console.error('Error fetching related products:', err)
    }
  }

  async function handleAddToCart() {
    if (!user) {
      router.push('/login?redirect=/products/' + productId)
      return
    }

    if (!product) return

    setAddingToCart(true)
    try {
      // Get product detail ID (ChiTietSanPham.id) from product data
      if (!product.productDetailId) {
        throw new Error('Sản phẩm chưa có thông tin chi tiết. Vui lòng thử lại sau.')
      }
      
      await api.cart.add({
        userId: user.userId,
        productDetailId: product.productDetailId, // ChiTietSanPham.id
        quantity: quantity,
      })

      // Show success message
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      successMsg.textContent = '✅ Đã thêm vào giỏ hàng!'
      document.body.appendChild(successMsg)
      setTimeout(() => {
        successMsg.remove()
      }, 3000)
    } catch (err: any) {
      // Show error message
      const errorMsg = document.createElement('div')
      errorMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      errorMsg.textContent = '❌ ' + (err.message || 'Không thể thêm vào giỏ hàng')
      document.body.appendChild(errorMsg)
      setTimeout(() => {
        errorMsg.remove()
      }, 3000)
    } finally {
      setAddingToCart(false)
    }
  }

  function handleBuyNow() {
    if (!user) {
      router.push('/login?redirect=/products/' + productId)
      return
    }

    handleAddToCart()
    // Redirect to cart after adding
    setTimeout(() => {
      router.push('/cart')
    }, 500)
  }

  function formatPrice(price: string | number): string {
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
          <p className="text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Sản phẩm không tồn tại'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">
              Trang chủ
            </Link>
            <span className="text-gray-400">/</span>
            {product.category && (
              <>
                <Link href={`/categories/${product.categoryId}`} className="text-gray-600 hover:text-blue-600">
                  {product.category}
                </Link>
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
                
                // Check if image is placeholder or empty
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
              const containerWidth = 500 // Approximate container width
              const maxVisible = Math.floor(containerWidth / (thumbnailWidth + thumbnailGap))
              const canScrollLeft = thumbnailScrollPosition > 0
              const canScrollRight = thumbnailScrollPosition < ((mediaUrls.length - maxVisible) * (thumbnailWidth + thumbnailGap))
              
              return (
                <div className="relative border-t border-gray-200 bg-white">
                  <div className="flex items-center gap-2 p-3">
                    {/* Scroll Left Button - Always show if can scroll */}
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
                    
                    {/* Thumbnail Strip */}
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
                                // Auto-scroll to center selected thumbnail
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
                    
                    {/* Scroll Right Button - Always show if can scroll */}
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

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < (product.rating || 5)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                ({product.reviews || 0} đánh giá)
              </span>
            </div>

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
                    Danh mục: <Link href={`/categories/${product.categoryId}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">{product.category}</Link>
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

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center border border-gray-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                {addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Mua ngay
              </button>
            </div>

            {/* Product Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 w-24">Danh mục:</span>
                  <span className="text-gray-900">{product.category || 'Chưa phân loại'}</span>
                </div>
                {product.code && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 w-24">Mã SP:</span>
                    <span className="text-gray-900">{product.code}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/products/${relatedProduct.id}`}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={relatedProduct.image || '/placeholder-product.jpg'}
                      alt={relatedProduct.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-lg font-bold text-blue-600">
                      {formatPrice(relatedProduct.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
