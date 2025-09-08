import { render, screen } from '@testing-library/react'
import { useSearchParams } from 'next/navigation'
import SignIn from '@/app/auth/signin/page'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}))

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

// Mock NextAuth providers
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  getProviders: jest.fn().mockResolvedValue({
    google: {
      id: 'google',
      name: 'Google',
      type: 'oauth',
      signinUrl: '/api/auth/signin/google',
      callbackUrl: '/api/auth/callback/google',
    },
  }),
}))

describe('SignIn - Logout Success Message', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays logout success message with green styling', () => {
    // Mock search params to include logout-success message
    const mockSearchParams = new URLSearchParams('message=logout-success')
    mockUseSearchParams.mockReturnValue(mockSearchParams)

    render(<SignIn />)

    // Check that the success message is displayed
    expect(screen.getByText(/logout completato con successo/i)).toBeInTheDocument()
    
    // Check that the message container has green styling
    const messageText = screen.getByText(/logout completato con successo/i)
    const messageContainer = messageText.closest('div')
    const outerContainer = messageContainer?.parentElement
    
    expect(outerContainer).toHaveClass('bg-green-50', 'border-green-200')
    expect(messageContainer).toHaveClass('text-green-800')
  })

  it('displays logout success message even when no errors are present', () => {
    // Mock search params with only logout-success message (no errors)
    const mockSearchParams = new URLSearchParams('message=logout-success')
    mockUseSearchParams.mockReturnValue(mockSearchParams)

    render(<SignIn />)

    // Should display the standalone success message
    expect(screen.getByText(/logout completato con successo/i)).toBeInTheDocument()
    
    // Should have green styling
    const messageText = screen.getByText(/logout completato con successo/i)
    const messageContainer = messageText.closest('div')
    const outerContainer = messageContainer?.parentElement
    
    expect(outerContainer).toHaveClass('bg-green-50', 'border-green-200')
  })

  it('does not display logout message when not present in search params', () => {
    // Mock search params without logout message
    const mockSearchParams = new URLSearchParams('')
    mockUseSearchParams.mockReturnValue(mockSearchParams)

    render(<SignIn />)

    // Should not display logout success message
    expect(screen.queryByText(/logout completato con successo/i)).not.toBeInTheDocument()
  })

  it('displays logout message alongside other success messages correctly', () => {
    // Mock search params with logout-success message
    const mockSearchParams = new URLSearchParams('message=logout-success')
    mockUseSearchParams.mockReturnValue(mockSearchParams)

    render(<SignIn />)

    // Check that logout success message is treated the same as other success messages
    const messageText = screen.getByText(/logout completato con successo/i)
    const messageContainer = messageText.closest('div')
    const outerContainer = messageContainer?.parentElement
    
    expect(outerContainer).toHaveClass('bg-green-50', 'border-green-200')
    
    // Verify it's styled as a success message (green), not an error (red)
    expect(outerContainer).not.toHaveClass('bg-red-50', 'border-red-200')
  })
})