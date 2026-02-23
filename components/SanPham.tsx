'use client'

import React, { useEffect, useState, useCallback, useMemo, memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { Product } from '@/lib/models'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Memoized Product Card để tránh re-render không cần thiết
const ProductCard = memo(({ product }: { product: Product }) => {
  return (
    <Link
      href={`/products/${product.id}`}
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer"
    >
      <div className="relative h-64 overflow-hidden">
        <Image
          src={product.image || '/placeholder-product.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
          className="object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
          quality={85}
        />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < product.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
          <span className="text-sm text-gray-600 ml-2">
            ({product.reviews})
          </span>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xl font-bold text-primary-600 mb-4">
          {product.price}
        </p>
        <div className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-sm text-center">
          Xem chi tiết
        </div>
      </div>
    </Link>
  )
})

ProductCard.displayName = 'ProductCard'

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const limit = 20
  const fetchingRef = React.useRef(false) // Dùng ref để track đang fetch

  const fetchProducts = useCallback(async (page: number) => {
    // Tránh multiple calls khi đang fetch (dùng ref thay vì state)
    if (fetchingRef.current) return
    fetchingRef.current = true
    
    try {
      setLoading(true)
      setError(null)
      
      // Chỉ log trong development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Fetching products page ${page}...`)
      }
      
      // Fetch với pagination - dùng cache để load nhanh hơn
      const response = await fetch(`/api/products?page=${page}&limit=${limit}`, {
        cache: 'default',
        next: { revalidate: 60 } // Revalidate sau 60 giây
      })
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Không thể tải sản phẩm')
      }
      
      const productsData = result.data || []
      const paginationInfo = result.pagination
      
      // Chỉ log trong development
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Loaded ${productsData.length} products (page ${page})`)
        if (paginationInfo) {
          console.log(`📄 Pagination: ${paginationInfo.page}/${paginationInfo.totalPages} (Total: ${paginationInfo.total})`)
        }
      }
      
      setProducts(productsData)
      setPagination(paginationInfo || null)
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể tải sản phẩm'
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error fetching products:', err)
      }
      setError(errorMsg)
    } finally {
      setLoading(false)
      fetchingRef.current = false // Reset ref sau khi fetch xong
    }
  }, [limit])

  useEffect(() => {
    fetchProducts(currentPage)
  }, [currentPage, fetchProducts])
  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              ĐỒ GIA DỤNG NỔI BẬT
            </h2>
            <div className="w-24 h-1 bg-primary-600 mx-auto"></div>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-600">Đang tải sản phẩm...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              ĐỒ GIA DỤNG NỔI BẬT
            </h2>
            <div className="w-24 h-1 bg-primary-600 mx-auto"></div>
          </div>
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            ĐỒ GIA DỤNG NỔI BẬT
          </h2>
          <div className="w-24 h-1 bg-primary-600 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">Chưa có sản phẩm nào</p>
            </div>
          ) : (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                currentPage === 1
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
                const maxVisible = Math.min(5, totalPages)
                
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
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage === pagination.totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                currentPage === pagination.totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              Sau
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Pagination Info */}
        {pagination && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Hiển thị {(currentPage - 1) * limit + 1} - {Math.min(currentPage * limit, pagination.total)} / {pagination.total} sản phẩm
          </div>
        )}
      </div>
    </section>
  )
}
