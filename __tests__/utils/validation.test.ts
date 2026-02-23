/**
 * Unit tests for validation utilities
 */

describe('Validation Utilities', () => {
  describe('Email validation', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('admin@shop365.vn')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('test@.com')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('Phone validation', () => {
    const isValidPhone = (phone: string): boolean => {
      const phoneRegex = /^[0-9]{10,11}$/
      return phoneRegex.test(phone.replace(/\s/g, ''))
    }

    it('should validate correct phone numbers', () => {
      expect(isValidPhone('0987654321')).toBe(true)
      expect(isValidPhone('0123456789')).toBe(true)
      expect(isValidPhone('0987 654 321')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('12345')).toBe(false)
      expect(isValidPhone('abc1234567')).toBe(false)
      expect(isValidPhone('')).toBe(false)
    })
  })

  describe('Required field validation', () => {
    const isRequired = (value: string | null | undefined): boolean => {
      return value !== null && value !== undefined && value.trim().length > 0
    }

    it('should validate non-empty strings', () => {
      expect(isRequired('test')).toBe(true)
      expect(isRequired('  test  ')).toBe(true)
    })

    it('should reject empty values', () => {
      expect(isRequired('')).toBe(false)
      expect(isRequired('   ')).toBe(false)
      expect(isRequired(null)).toBe(false)
      expect(isRequired(undefined)).toBe(false)
    })
  })

  describe('Password strength validation', () => {
    const isStrongPassword = (password: string): boolean => {
      return password.length >= 6
    }

    it('should validate strong passwords', () => {
      expect(isStrongPassword('password123')).toBe(true)
      expect(isStrongPassword('123456')).toBe(true)
    })

    it('should reject weak passwords', () => {
      expect(isStrongPassword('12345')).toBe(false)
      expect(isStrongPassword('')).toBe(false)
    })
  })
})
