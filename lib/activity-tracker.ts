/**
 * Activity Tracker - Track user activity và tự động đăng xuất sau thời gian không hoạt động
 */

let lastActivityTime: number = Date.now()
let inactivityTimer: NodeJS.Timeout | null = null
let logoutCallback: (() => void) | null = null
let isTracking = false

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000 // 15 phút

/**
 * Reset thời gian hoạt động cuối cùng
 */
export function updateActivity(): void {
  lastActivityTime = Date.now()
  // Không log mỗi lần activity để tránh spam console
}

/**
 * Bắt đầu track user activity
 */
export function startActivityTracking(onLogout: () => void): void {
  if (typeof window === 'undefined') return
  
  // Nếu đã tracking rồi thì không start lại
  if (isTracking) {
    console.log('⚠️ Activity tracking already started')
    return
  }
  
  logoutCallback = onLogout
  isTracking = true
  
  // Reset activity time
  updateActivity()
  
  // Track các sự kiện user interaction
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  
  events.forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true })
  })
  
  // Track khi window focus
  window.addEventListener('focus', updateActivity)
  
  // Bắt đầu check inactivity
  checkInactivity()
  
  console.log('✅ Activity tracking started (auto-logout after 15 minutes of inactivity)')
}

/**
 * Dừng track user activity
 */
export function stopActivityTracking(): void {
  if (typeof window === 'undefined') return
  
  if (!isTracking) {
    return // Đã stop rồi
  }
  
  isTracking = false
  
  // Clear timer
  if (inactivityTimer) {
    clearInterval(inactivityTimer)
    inactivityTimer = null
  }
  
  // Remove event listeners
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  events.forEach(event => {
    document.removeEventListener(event, updateActivity)
  })
  
  window.removeEventListener('focus', updateActivity)
  
  logoutCallback = null
  
  console.log('⏹️ Activity tracking stopped')
}

/**
 * Kiểm tra inactivity và tự động đăng xuất nếu cần
 */
function checkInactivity(): void {
  if (typeof window === 'undefined') return
  
  // Clear timer cũ nếu có
  if (inactivityTimer) {
    clearInterval(inactivityTimer)
  }
  
  // Check mỗi phút
  inactivityTimer = setInterval(() => {
    if (!isTracking) return // Đã stop tracking
    
    const now = Date.now()
    const timeSinceLastActivity = now - lastActivityTime
    
    if (timeSinceLastActivity >= INACTIVITY_TIMEOUT_MS) {
      console.log('⏰ Inactivity timeout reached (15 minutes), auto-logging out...')
      console.log(`   Last activity: ${new Date(lastActivityTime).toLocaleString()}`)
      console.log(`   Time since last activity: ${Math.floor(timeSinceLastActivity / 1000 / 60)} phút`)
      
      // Tự động đăng xuất
      if (logoutCallback) {
        logoutCallback()
      }
      
      // Stop tracking sau khi logout
      stopActivityTracking()
    } else {
      const minutesRemaining = Math.ceil((INACTIVITY_TIMEOUT_MS - timeSinceLastActivity) / 1000 / 60)
      // Chỉ log warning khi còn 5 phút hoặc ít hơn
      if (minutesRemaining <= 5 && minutesRemaining > 0) {
        console.log(`⏳ Cảnh báo: ${minutesRemaining} phút còn lại trước khi tự động đăng xuất`)
      }
    }
  }, 60 * 1000) // Check mỗi phút
}

/**
 * Lấy thời gian còn lại trước khi tự động đăng xuất (tính bằng giây)
 */
export function getTimeUntilLogout(): number {
  const now = Date.now()
  const timeSinceLastActivity = now - lastActivityTime
  const remaining = INACTIVITY_TIMEOUT_MS - timeSinceLastActivity
  return Math.max(0, Math.floor(remaining / 1000))
}

/**
 * Reset inactivity timer (dùng khi user thực hiện action quan trọng)
 */
export function resetInactivityTimer(): void {
  updateActivity()
}
