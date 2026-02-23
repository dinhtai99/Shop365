'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, ArrowLeft, Share2 } from 'lucide-react'

export default function NewsDetailPage() {
  const params = useParams()
  const newsId = params?.id as string

  const [news, setNews] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNews()
  }, [newsId])

  async function fetchNews() {
    try {
      setLoading(true)
      const response = await fetch(`/api/news/${newsId}`)
      const result = await response.json()

      if (result.success) {
        setNews(result.data)
      } else {
        setError(result.error || 'Không tìm thấy tin tức')
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải tin tức')
      console.error('Error fetching news:', err)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải tin tức...</p>
        </div>
      </div>
    )
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Tin tức không tồn tại'}</p>
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách tin tức
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">
              Trang chủ
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/news" className="text-gray-600 hover:text-blue-600">
              Tin tức
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium line-clamp-1">{news.title}</span>
          </div>
        </div>
      </div>

      <article className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách tin tức
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {news.title}
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{formatDate(news.date)}</span>
              </div>
              <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <Share2 className="w-5 h-5" />
                <span>Chia sẻ</span>
              </button>
            </div>
          </div>

          {/* Featured Image */}
          {news.image && (
            <div className="relative h-96 mb-8 rounded-lg overflow-hidden">
              <Image
                src={news.image || '/placeholder-product.jpg'}
                alt={news.title}
                fill
                sizes="(max-width: 768px) 100vw, 896px"
                className="object-cover"
                priority
                quality={90}
              />
            </div>
          )}

          {/* Content */}
          <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              {news.content ? (
                <div
                  className="text-gray-700 whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: news.content }}
                />
              ) : (
                <p className="text-gray-700">{news.excerpt}</p>
              )}
            </div>
          </div>

          {/* Related News */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tin tức liên quan</h2>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600">Tính năng đang được phát triển</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
