/**
 * Next.js Middleware
 * Apply security headers và rate limiting cho tất cả requests
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { applySecurityHeaders } from '@/lib/security-headers'
import { checkRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { verifyAccessToken } from '@/lib/jwt'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Protect admin routes - chỉ ADMIN mới được truy cập
  if (pathname.startsWith('/admin')) {
    try {
      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get('session')
      const authHeader = request.headers.get('authorization')
      
      let userRole: string | null = null
      
      // Check session cookie
      if (sessionCookie) {
        try {
          const sessionData = await verifySession(sessionCookie.value)
          if (sessionData) {
            userRole = sessionData.role
          }
        } catch {
          // Session invalid
        }
      }
      
      // Check Authorization header nếu chưa có từ cookie
      if (!userRole && authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7)
          const payload = await verifyAccessToken(token)
          if (payload) {
            userRole = payload.role
          }
        } catch {
          // Token invalid
        }
      }
      
      // Block nếu không có auth hoặc không phải ADMIN
      if (!userRole || userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
      }
    } catch (error) {
      // Nếu có lỗi khi check auth, redirect về login
      console.error('Middleware admin check error:', error)
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }
  }
  
  // Auto-redirect admin users to /admin if they're on homepage
  if (pathname === '/' && request.method === 'GET') {
    try {
      // Check if user is admin
      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get('session')
      const authHeader = request.headers.get('authorization')
      
      let isAdmin = false
      
      // Check session cookie
      if (sessionCookie) {
        try {
          const sessionData = await verifySession(sessionCookie.value)
          if (sessionData && sessionData.role === 'ADMIN') {
            isAdmin = true
          }
        } catch {
          // Session invalid, continue
        }
      }
      
      // Check Authorization header
      if (!isAdmin && authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7)
          const payload = await verifyAccessToken(token)
          if (payload && payload.role === 'ADMIN') {
            isAdmin = true
          }
        } catch {
          // Token invalid, continue
        }
      }
      
      // Redirect admin to /admin
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    } catch (error) {
      // If error checking auth, continue normally
      console.error('Middleware auth check error:', error)
    }
  }
  
  const response = NextResponse.next()
  
  // Apply security headers
  applySecurityHeaders(response)
  
  // Rate limiting cho API endpoints
  
  // Get client IP
  const ip = request.ip || 
             request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  // Rate limit cho login endpoint
  if (pathname === '/api/auth/login') {
    if (!checkRateLimit(`login:${ip}`, rateLimitConfigs.login)) {
      return NextResponse.json(
        { success: false, error: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.' },
        { status: 429 }
      )
    }
  }
  
  // Rate limit cho register endpoint
  if (pathname === '/api/users' && request.method === 'POST') {
    if (!checkRateLimit(`register:${ip}`, rateLimitConfigs.register)) {
      return NextResponse.json(
        { success: false, error: 'Quá nhiều lần thử đăng ký. Vui lòng thử lại sau 1 giờ.' },
        { status: 429 }
      )
    }
  }
  
  // Rate limit cho refresh token endpoint
  if (pathname === '/api/auth/refresh') {
    if (!checkRateLimit(`refresh:${ip}`, rateLimitConfigs.refresh)) {
      return NextResponse.json(
        { success: false, error: 'Quá nhiều requests. Vui lòng thử lại sau.' },
        { status: 429 }
      )
    }
  }
  
  // Rate limit cho các API endpoints khác (trừ public endpoints và auth check)
  if (pathname.startsWith('/api/') && 
      !pathname.startsWith('/api/auth/login') &&
      !pathname.startsWith('/api/auth/refresh') &&
      !pathname.startsWith('/api/auth/me') && // Exclude auth check endpoint (called frequently by header)
      !pathname.startsWith('/api/products') && // Public endpoints
      !pathname.startsWith('/api/categories') &&
      !pathname.startsWith('/api/news') &&
      !pathname.startsWith('/api/combos') &&
      !pathname.startsWith('/api/featured') &&
      !pathname.startsWith('/api/swagger')) {
    
    if (!checkRateLimit(`api:${ip}`, rateLimitConfigs.api)) {
      return NextResponse.json(
        { success: false, error: 'Quá nhiều requests. Vui lòng thử lại sau.' },
        { status: 429 }
      )
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
