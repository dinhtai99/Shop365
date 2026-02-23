import dynamic from 'next/dynamic'
import Hero from '@/components/Banner'

// Lazy load các components để tăng tốc độ initial load
const FeaturedProjects = dynamic(() => import('@/components/SanPhamNoiBat'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: true,
})

const ProductCombos = dynamic(() => import('@/components/ComboSanPham'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: true,
})

const Products = dynamic(() => import('@/components/SanPham'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: true,
})

const NewsEvents = dynamic(() => import('@/components/TinTuc'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: true,
})

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <FeaturedProjects />
      <ProductCombos />
      <Products />
      <NewsEvents />
    </div>
  )
}
