/**
 * Script để clear account lockout cho user
 * Usage: node scripts/clear-lockout.js <email>
 */

require('dotenv').config({ path: '.env.local' })

// Import account lockout functions
const { clearFailedAttempts, isAccountLocked } = require('../lib/account-lockout')

async function clearLockout() {
  const email = process.argv[2]
  
  if (!email) {
    console.log('❌ Usage: node scripts/clear-lockout.js <email>')
    console.log('   Example: node scripts/clear-lockout.js user@gmail.com')
    process.exit(1)
  }

  try {
    const normalizedEmail = email.trim().toLowerCase()
    
    console.log(`🔓 Clearing lockout for: ${normalizedEmail}\n`)
    
    // Check current lockout status
    const lockStatus = isAccountLocked(normalizedEmail)
    
    if (lockStatus.locked) {
      const minutesLeft = Math.ceil(
        (lockStatus.lockedUntil.getTime() - Date.now()) / (60 * 1000)
      )
      console.log(`⚠️  Account is currently locked`)
      console.log(`   Locked until: ${lockStatus.lockedUntil.toLocaleString()}`)
      console.log(`   Minutes remaining: ${minutesLeft}\n`)
    } else {
      console.log(`✅ Account is not locked\n`)
    }
    
    // Clear failed attempts
    clearFailedAttempts(normalizedEmail)
    console.log(`✅ Cleared failed login attempts`)
    
    // Verify lockout is cleared
    const newLockStatus = isAccountLocked(normalizedEmail)
    if (!newLockStatus.locked) {
      console.log(`✅ Account lockout cleared successfully!`)
      console.log(`\n💡 You can now try logging in again.`)
    } else {
      console.log(`⚠️  Account is still locked (this shouldn't happen)`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

clearLockout()
