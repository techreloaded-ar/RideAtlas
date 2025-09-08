import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { UserRole } from '@/types/profile'

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

// Mock window.location.href
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
})

describe('Navbar - Logout Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUsePathname.mockReturnValue('/')
    window.location.href = ''
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  const mockAuthenticatedSession = {
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.Explorer,
      image: null,
    },
  }

  describe('Desktop logout', () => {
    it('calls signOut with correct parameters when logout button is clicked', async () => {
      mockUseSession.mockReturnValue({
        data: mockAuthenticatedSession,
        status: 'authenticated',
        update: jest.fn(),
      })
      mockSignOut.mockResolvedValue(undefined)

      render(<Navbar />)

      // Open user menu
      const userMenuButton = screen.getByRole('button', { name: /TU/i })
      fireEvent.click(userMenuButton)

      // Click logout button
      const logoutButton = screen.getByRole('button', { name: /esci/i })
      fireEvent.click(logoutButton)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({
          callbackUrl: '/auth/signin?message=logout-success',
          redirect: true,
        })
      })
    })

    it('falls back to manual redirect when signOut fails', async () => {
      mockUseSession.mockReturnValue({
        data: mockAuthenticatedSession,
        status: 'authenticated',
        update: jest.fn(),
      })
      mockSignOut.mockRejectedValue(new Error('SignOut failed'))

      render(<Navbar />)

      // Open user menu
      const userMenuButton = screen.getByRole('button', { name: /TU/i })
      fireEvent.click(userMenuButton)

      // Click logout button
      const logoutButton = screen.getByRole('button', { name: /esci/i })
      fireEvent.click(logoutButton)

      await waitFor(() => {
        expect(window.location.href).toBe('/auth/signin?message=logout-success')
      })
    })
  })

  describe('Mobile logout', () => {
    it('calls signOut with correct parameters when mobile logout button is clicked', async () => {
      mockUseSession.mockReturnValue({
        data: mockAuthenticatedSession,
        status: 'authenticated',
        update: jest.fn(),
      })
      mockSignOut.mockResolvedValue(undefined)

      render(<Navbar />)

      // Open mobile menu
      const mobileMenuButton = screen.getByRole('button', { name: /apri menu principale/i })
      fireEvent.click(mobileMenuButton)

      // Click mobile logout button
      const mobileLogoutButtons = screen.getAllByRole('button', { name: /esci/i })
      const mobileLogoutButton = mobileLogoutButtons.find(button => 
        button.className.includes('text-base')
      )
      
      expect(mobileLogoutButton).toBeDefined()
      fireEvent.click(mobileLogoutButton!)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({
          callbackUrl: '/auth/signin?message=logout-success',
          redirect: true,
        })
      })
    })
  })

  describe('Unauthenticated state', () => {
    it('does not show logout button when user is not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      render(<Navbar />)

      // Should not find any logout buttons
      expect(screen.queryByRole('button', { name: /esci/i })).not.toBeInTheDocument()
      
      // Should show login/register links instead
      expect(screen.getByRole('link', { name: /accedi/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /registrati/i })).toBeInTheDocument()
    })
  })
})