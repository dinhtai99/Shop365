/**
 * Unit tests for Header component
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import Header from '@/components/DauTrang'
import { api } from '@/lib/api'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock API
jest.mock('@/lib/api', () => ({
  api: {
    categories: {
      getAll: jest.fn(),
    },
    cart: {
      get: jest.fn(),
    },
  },
}))

// Mock fetch
global.fetch = jest.fn()

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false }),
    })
  })

  it('should render header with logo', async () => {
    await act(async () => {
      render(<Header />)
    })
    
    await waitFor(() => {
      const logo = screen.getByAltText('GIA DUNG 365 PLUS')
      expect(logo).toBeInTheDocument()
    })
  })

  it('should render navigation menu', async () => {
    await act(async () => {
      render(<Header />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Khuyến mãi')).toBeInTheDocument()
      expect(screen.getByText('Tin tức')).toBeInTheDocument()
      expect(screen.getByText('Giới thiệu')).toBeInTheDocument()
      expect(screen.getByText('Liên hệ')).toBeInTheDocument()
    })
  })

  it('should display login/register buttons when user is not logged in', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false }),
    })

    await act(async () => {
      render(<Header />)
    })

    await waitFor(() => {
      expect(screen.getByText('Đăng nhập')).toBeInTheDocument()
      expect(screen.getByText('Đăng ký')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should display user menu when user is logged in', async () => {
    const mockUser = {
      userId: 1,
      email: 'test@example.com',
      role: 'USER' as const,
      fullName: 'Test User',
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { user: mockUser },
      }),
    })

    ;(api.cart.get as jest.Mock).mockResolvedValue({
      items: [{ quantity: 2 }, { quantity: 3 }],
    })

    await act(async () => {
      render(<Header />)
    })

    await waitFor(() => {
      expect(screen.getByText(/Test User|test@example.com/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should fetch and display categories', async () => {
    const mockCategories = [
      { id: 1, name: 'Điện tử' },
      { id: 2, name: 'Gia dụng' },
    ]

    ;(api.categories.getAll as jest.Mock).mockResolvedValue(mockCategories)

    await act(async () => {
      render(<Header />)
    })

    await waitFor(() => {
      expect(api.categories.getAll).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('should display cart count when user has items in cart', async () => {
    const mockUser = {
      userId: 1,
      email: 'test@example.com',
      role: 'USER' as const,
      fullName: 'Test User',
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { user: mockUser },
      }),
    })

    ;(api.cart.get as jest.Mock).mockResolvedValue({
      items: [{ quantity: 2 }, { quantity: 3 }],
    })

    await act(async () => {
      render(<Header />)
    })

    await waitFor(() => {
      expect(api.cart.get).toHaveBeenCalledWith(mockUser.userId)
    }, { timeout: 3000 })
  })
})
