/**
 * Secure Token Storage - Memory-based
 * Lưu access token trong memory thay vì localStorage để tăng bảo mật
 * 
 * Ưu điểm:
 * - Không thể đọc bởi XSS attacks
 * - Tự động clear khi refresh page
 * - Kết hợp với httpOnly refresh token cookie
 * - Auto-refresh khi page load
 */

let accessToken: string | null = null

/**
 * Lưu access token vào memory
 */
export function saveAccessToken(token: string): void {
  accessToken = token
}

/**
 * Lấy access token từ memory
 */
export function getAccessToken(): string | null {
  return accessToken
}

/**
 * Xóa access token
 */
export function removeAccessToken(): void {
  accessToken = null
}

/**
 * Kiểm tra có access token không
 */
export function hasAccessToken(): boolean {
  return accessToken !== null
}

/**
 * Tự động refresh token khi page load (nếu có refreshToken cookie)
 * Chỉ chạy ở client-side
 */
if (typeof window !== 'undefined') {
  // Auto-refresh khi page load
  const autoRefreshToken = async () => {
    // Chỉ refresh nếu không có access token
    if (!accessToken) {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        })

        const data = await response.json()

        if (data.success && data.data?.accessToken) {
          accessToken = data.data.accessToken
          console.log('✅ Auto-refreshed access token on page load')
          
          // Dispatch custom event để Header component biết token đã được refresh
          window.dispatchEvent(new CustomEvent('tokenRefreshed'))
        }
      } catch (error) {
        // Không có refresh token hoặc đã hết hạn
        // Không làm gì, user sẽ cần login lại
      }
    }
  }
  
  // Chạy ngay khi module load (DOMContentLoaded)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoRefreshToken)
  } else {
    // DOM đã sẵn sàng, chạy ngay
    autoRefreshToken()
  }
  
  // Cũng chạy khi window load (backup)
  window.addEventListener('load', autoRefreshToken)

  // Clear token khi đóng tab/window (optional)
  // Không clear ở đây vì muốn giữ token trong cùng session
  // Nếu muốn clear khi đóng tab, uncomment dòng dưới:
  // window.addEventListener('beforeunload', () => {
  //   accessToken = null
  // })
}
