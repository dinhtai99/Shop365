'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { api } from '@/lib/api'
import { FeaturedProject } from '@/lib/models'

export default function FeaturedProjects() {
  const [projects, setProjects] = useState<FeaturedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        const data = await api.featured.getAll()
        setProjects(data as FeaturedProject[])
      } catch (err: any) {
        setError(err.message || 'Không thể tải sản phẩm nổi bật')
        console.error('Error fetching featured projects:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])
  if (loading) {
    return (
      <section id="projects" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              SẢN PHẨM NỔI BẬT
            </h2>
            <div className="w-24 h-1 bg-primary-600 mx-auto"></div>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-600">Đang tải sản phẩm nổi bật...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="projects" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              SẢN PHẨM NỔI BẬT
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
    <section id="projects" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            SẢN PHẨM NỔI BẬT
          </h2>
          <div className="w-24 h-1 bg-primary-600 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">Chưa có sản phẩm nổi bật nào</p>
            </div>
          ) : (
            projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 group cursor-pointer"
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={project.image || '/placeholder-product.jpg'}
                  alt={project.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  quality={85}
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-3">
                  {project.title}
                </h3>
                <a
                  href="#"
                  className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2"
                >
                  Xem chi tiết
                  <span>→</span>
                </a>
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
