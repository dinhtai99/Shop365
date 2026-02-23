'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { api } from '@/lib/api'
import { ProductCombo } from '@/lib/models'

export default function ProductCombos() {
  const [combos, setCombos] = useState<ProductCombo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCombos() {
      try {
        setLoading(true)
        const data = await api.combos.getAll()
        setCombos(data as ProductCombo[])
      } catch (err: any) {
        setError(err.message || 'Không thể tải combo')
        console.error('Error fetching combos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCombos()
  }, [])
  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              COMBO ĐỒ GIA DỤNG NỔI BẬT
            </h2>
            <div className="w-24 h-1 bg-primary-600 mx-auto"></div>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-600">Đang tải combo...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              COMBO ĐỒ GIA DỤNG NỔI BẬT
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
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            COMBO ĐỒ GIA DỤNG NỔI BẬT
          </h2>
          <div className="w-24 h-1 bg-primary-600 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {combos.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">Chưa có combo nào</p>
            </div>
          ) : (
            combos.map((combo) => (
            <div
              key={combo.id}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100"
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={combo.image || '/placeholder-product.jpg'}
                  alt={combo.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  quality={85}
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {combo.name}
                </h3>
                {combo.price && (
                  <p className="text-xl font-bold text-primary-600 mb-4">
                    {combo.price}
                  </p>
                )}
                <button className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                  Liên hệ
                </button>
              </div>
            </div>
            ))
          )}
        </div>

        <div className="text-center mt-12">
          <a
            href="#"
            className="inline-block text-primary-600 hover:text-primary-700 font-semibold text-lg"
          >
            XEM THÊM →
          </a>
        </div>
      </div>
    </section>
  )
}
