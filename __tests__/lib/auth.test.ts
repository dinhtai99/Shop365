/**
 * Unit tests for authentication utilities
 */

import { getSession, requireAuth, requireAdmin, requireUser, requireRole } from '@/lib/auth'
import { cookies } from 'next/headers'

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('Auth Utilities', () => {
  const mockCookies = cookies as jest.MockedFunction<typeof cookies>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSession', () => {
    it('should return session data when cookie exists', async () => {
      const mockSession = {
        userId: 1,
        email: 'test@example.com',
        role: 'USER' as const,
        fullName: 'Test User',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({
          value: JSON.stringify(mockSession),
        }),
      } as any)

      const result = await getSession()

      expect(result).toEqual(mockSession)
    })

    it('should return null when no cookie exists', async () => {
      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      } as any)

      const result = await getSession()

      expect(result).toBeNull()
    })

    it('should return null when cookie is invalid JSON', async () => {
      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({
          value: 'invalid json',
        }),
      } as any)

      const result = await getSession()

      expect(result).toBeNull()
    })
  })

  describe('requireAuth', () => {
    it('should return session when authenticated', async () => {
      const mockSession = {
        userId: 1,
        email: 'test@example.com',
        role: 'USER' as const,
        fullName: 'Test User',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({
          value: JSON.stringify(mockSession),
        }),
      } as any)

      const result = await requireAuth()

      expect(result).toEqual(mockSession)
    })

    it('should throw error when not authenticated', async () => {
      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      } as any)

      await expect(requireAuth()).rejects.toThrow('Unauthorized')
    })
  })

  describe('requireAdmin', () => {
    it('should return session when user is ADMIN', async () => {
      const mockSession = {
        userId: 1,
        email: 'admin@example.com',
        role: 'ADMIN' as const,
        fullName: 'Admin User',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({
          value: JSON.stringify(mockSession),
        }),
      } as any)

      const result = await requireAdmin()

      expect(result).toEqual(mockSession)
    })

    it('should throw error when user is not ADMIN', async () => {
      const mockSession = {
        userId: 1,
        email: 'user@example.com',
        role: 'USER' as const,
        fullName: 'Regular User',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({
          value: JSON.stringify(mockSession),
        }),
      } as any)

      await expect(requireAdmin()).rejects.toThrow('Forbidden: Admin access required')
    })
  })

  describe('requireUser', () => {
    it('should return session when user is USER', async () => {
      const mockSession = {
        userId: 1,
        email: 'user@example.com',
        role: 'USER' as const,
        fullName: 'Regular User',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({
          value: JSON.stringify(mockSession),
        }),
      } as any)

      const result = await requireUser()

      expect(result).toEqual(mockSession)
    })

    it('should return session when user is ADMIN', async () => {
      const mockSession = {
        userId: 1,
        email: 'admin@example.com',
        role: 'ADMIN' as const,
        fullName: 'Admin User',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({
          value: JSON.stringify(mockSession),
        }),
      } as any)

      const result = await requireUser()

      expect(result).toEqual(mockSession)
    })
  })

  describe('requireRole', () => {
    it('should return session when role matches single role', async () => {
      const mockSession = {
        userId: 1,
        email: 'admin@example.com',
        role: 'ADMIN' as const,
        fullName: 'Admin User',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({
          value: JSON.stringify(mockSession),
        }),
      } as any)

      const result = await requireRole('ADMIN')

      expect(result).toEqual(mockSession)
    })

    it('should return session when role matches array of roles', async () => {
      const mockSession = {
        userId: 1,
        email: 'user@example.com',
        role: 'USER' as const,
        fullName: 'Regular User',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({
          value: JSON.stringify(mockSession),
        }),
      } as any)

      const result = await requireRole(['ADMIN', 'USER'])

      expect(result).toEqual(mockSession)
    })

    it('should throw error when role does not match', async () => {
      const mockSession = {
        userId: 1,
        email: 'user@example.com',
        role: 'USER' as const,
        fullName: 'Regular User',
      }

      mockCookies.mockReturnValue({
        get: jest.fn().mockReturnValue({
          value: JSON.stringify(mockSession),
        }),
      } as any)

      await expect(requireRole('ADMIN')).rejects.toThrow('Forbidden: Access requires role ADMIN')
    })
  })
})
