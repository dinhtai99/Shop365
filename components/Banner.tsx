import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative bg-white overflow-hidden">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="relative w-full">
          <Image
            src="/banner.png"
            alt="GIA DUNG 365 PLUS - Đồ gia dụng thông minh"
            width={1920}
            height={600}
            className="w-full h-auto object-contain rounded-lg shadow-lg"
            priority
          />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  )
}
