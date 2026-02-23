import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/DauTrang'
import Footer from '@/components/ChanTrang'

// Ensure CSS is loaded
if (typeof window !== 'undefined') {
  // Client-side check
  console.log('✅ CSS should be loaded')
}

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

export const metadata: Metadata = {
  title: 'GIA DUNG 365 PLUS - Đồ Gia Dụng Thông Minh',
  description: 'Đồ gia dụng thông minh, chất lượng cao cho không gian sống hiện đại',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
