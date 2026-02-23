'use client'

import { Building2, Target, Users, Award, Heart, Shield } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Về Chúng Tôi</h1>
          <p className="text-xl text-blue-100">
            GIA DUNG 365 PLUS - Đồng hành cùng không gian sống hiện đại của bạn
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Company Story */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Câu Chuyện Của Chúng Tôi</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p>
                GIA DUNG 365 PLUS được thành lập với sứ mệnh mang đến những sản phẩm đồ gia dụng 
                chất lượng cao, hiện đại và tiện ích cho mọi gia đình Việt Nam. Chúng tôi tin rằng 
                một không gian sống đẹp và tiện nghi sẽ mang lại cuộc sống hạnh phúc hơn cho bạn và gia đình.
              </p>
              <p>
                Với hơn 10 năm kinh nghiệm trong ngành, chúng tôi đã và đang phục vụ hàng nghìn khách hàng 
                trên khắp cả nước. Đội ngũ của chúng tôi luôn nỗ lực để mang đến những sản phẩm tốt nhất 
                với giá cả hợp lý nhất.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Sứ Mệnh</h3>
            </div>
            <p className="text-gray-700">
              Cung cấp những sản phẩm đồ gia dụng chất lượng cao, giá cả hợp lý, 
              giúp khách hàng xây dựng không gian sống hiện đại, tiện nghi và đầy cảm hứng.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Building2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Tầm Nhìn</h3>
            </div>
            <p className="text-gray-700">
              Trở thành thương hiệu đồ gia dụng hàng đầu Việt Nam, được tin tưởng và yêu mến 
              bởi hàng triệu khách hàng trên toàn quốc.
            </p>
          </div>
        </div>

        {/* Core Values */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Giá Trị Cốt Lõi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Chất Lượng</h3>
              <p className="text-gray-600">
                Cam kết chỉ cung cấp sản phẩm chính hãng, chất lượng cao với chế độ bảo hành đầy đủ.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 rounded-full">
                  <Heart className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tận Tâm</h3>
              <p className="text-gray-600">
                Luôn đặt khách hàng làm trung tâm, phục vụ với sự tận tâm và chu đáo nhất.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-purple-100 rounded-full">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Uy Tín</h3>
              <p className="text-gray-600">
                Xây dựng niềm tin qua từng sản phẩm, từng dịch vụ với sự minh bạch và trách nhiệm.
              </p>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Đội Ngũ Của Chúng Tôi</h2>
            </div>
            <p className="text-gray-700 mb-4">
              Chúng tôi tự hào có một đội ngũ nhân viên trẻ trung, năng động và đầy nhiệt huyết. 
              Mỗi thành viên đều được đào tạo chuyên nghiệp để mang đến dịch vụ tốt nhất cho khách hàng.
            </p>
            <p className="text-gray-700">
              Với sự đa dạng về kinh nghiệm và chuyên môn, đội ngũ của chúng tôi luôn sẵn sàng 
              tư vấn và hỗ trợ bạn tìm được những sản phẩm phù hợp nhất với nhu cầu và ngân sách.
            </p>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Liên Hệ Với Chúng Tôi</h2>
          <p className="text-xl text-blue-100 mb-6">
            Bạn có câu hỏi hoặc cần tư vấn? Chúng tôi luôn sẵn sàng hỗ trợ!
          </p>
          <Link
            href="/contact"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Liên hệ ngay
          </Link>
        </section>
      </div>
    </div>
  )
}
