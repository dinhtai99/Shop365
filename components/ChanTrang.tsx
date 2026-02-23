import { Phone, Mail, MapPin, Facebook } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Contact Info */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">LIÊN HỆ</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <span>Hotline: 0986.085.565</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <span>Hotline CSKH 01: 0961.405.056</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <span>Hotline CSKH 02: 0961.855.359</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <span>giadung365plus@gmail.com</span>
              </li>
              <li className="flex items-start gap-2 mt-2">
                <MapPin className="w-5 h-5 mt-1" />
                <span>MST : 0109246724 được cấp ngày 30-06-2020 do Chi cục Thuế Quận Cầu Giấy cấp</span>
              </li>
            </ul>
          </div>

          {/* Customer Policy */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">CHÍNH SÁCH KHÁCH HÀNG</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Hướng dẫn đặt hàng
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Chính sách kiểm hàng
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Chính sách thanh toán
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Chính sách vận chuyển
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Chính sách đổi trả, bảo hành
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Chính sách xử lý khiếu nại
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Chính sách bảo mật thông tin
                </a>
              </li>
            </ul>
          </div>

          {/* Showrooms */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">HỆ THỐNG SHOWROOM</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-semibold mb-2">Tại Hà Nội</h4>
                <p className="text-sm">
                  Tòa nhà C1, Vinaconex 1, 289A Khuất Duy Tiến, Hà Nội
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Tại Phú Thọ</h4>
                <p className="text-sm">
                  86 Phan Chu Trinh, Việt Trì, Phú Thọ.
                </p>
              </div>
            </div>
          </div>

          {/* Social & Info */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">KẾT NỐI VỚI CHÚNG TÔI</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span className="text-sm">
                  Tòa nhà C1, Vinaconex 1, 289A Khuất Duy Tiến, Cầu Giấy, Hà Nội.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <span>0986 085 565</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <span className="text-sm">giadung365plus@gmail.com</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>Copyright 2026 © GIA DUNG 365 PLUS</p>
        </div>
      </div>
    </footer>
  )
}
