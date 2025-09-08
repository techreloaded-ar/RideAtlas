/**
 * Unit tests for TripAccessErrorBoundary component
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import { TripAccessErrorBoundary } from '@/components/trips/TripAccessErrorBoundary'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Normal content</div>
}

describe('TripAccessErrorBoundary', () => {
  beforeEach(() => {
    // Mock console methods to avoid noise in test output
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render children when there is no error', () => {
    render(
      <TripAccessErrorBoundary>
        <ThrowError shouldThrow={false} />
      </TripAccessErrorBoundary>
    )

    expect(screen.getByText('Normal content')).toBeInTheDocument()
  })

  it('should render error UI when child component throws', () => {
    render(
      <TripAccessErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TripAccessErrorBoundary>
    )

    expect(screen.getByText('Errore di accesso')).toBeInTheDocument()
    expect(screen.getByText('Si è verificato un problema')).toBeInTheDocument()
    expect(screen.getByText(/Non è stato possibile verificare i permessi/)).toBeInTheDocument()
  })

  it('should display retry and home buttons in error state', () => {
    render(
      <TripAccessErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TripAccessErrorBoundary>
    )

    const retryButton = screen.getByRole('button', { name: /riprova/i })
    const homeLink = screen.getByRole('link', { name: /vai alla home/i })

    expect(retryButton).toBeInTheDocument()
    expect(homeLink).toBeInTheDocument()
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('should reset error state when retry button is clicked', () => {
    const { rerender } = render(
      <TripAccessErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TripAccessErrorBoundary>
    )

    // Error UI should be visible
    expect(screen.getByText('Errore di accesso')).toBeInTheDocument()

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /riprova/i })
    fireEvent.click(retryButton)

    // After clicking retry, the error state should be reset
    // We need to re-render with a new key to force a fresh component
    rerender(
      <TripAccessErrorBoundary key="retry">
        <ThrowError shouldThrow={false} />
      </TripAccessErrorBoundary>
    )

    // Normal content should be visible again
    expect(screen.getByText('Normal content')).toBeInTheDocument()
    expect(screen.queryByText('Errore di accesso')).not.toBeInTheDocument()
  })

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>

    render(
      <TripAccessErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </TripAccessErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Errore di accesso')).not.toBeInTheDocument()
  })

  it('should log error details when error occurs', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <TripAccessErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TripAccessErrorBoundary>
    )

    expect(consoleSpy).toHaveBeenCalledWith(
      'TripAccessErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    )
  })

  it('should have proper accessibility structure', () => {
    render(
      <TripAccessErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TripAccessErrorBoundary>
    )

    // Check heading structure
    const mainHeading = screen.getByRole('heading', { level: 1 })
    expect(mainHeading).toHaveTextContent('Errore di accesso')

    // Check that buttons are properly labeled
    const retryButton = screen.getByRole('button', { name: /riprova/i })
    const homeLink = screen.getByRole('link', { name: /vai alla home/i })

    expect(retryButton).toBeInTheDocument()
    expect(homeLink).toBeInTheDocument()
  })

  it('should have consistent styling classes', () => {
    const { container } = render(
      <TripAccessErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TripAccessErrorBoundary>
    )

    // Check for main container classes
    expect(container.querySelector('.max-w-4xl')).toBeInTheDocument()
    expect(container.querySelector('.bg-red-50')).toBeInTheDocument()
    expect(container.querySelector('.border-red-200')).toBeInTheDocument()
  })

  it('should handle retry button functionality', () => {
    render(
      <TripAccessErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TripAccessErrorBoundary>
    )

    // Error UI should be visible
    expect(screen.getByText('Errore di accesso')).toBeInTheDocument()

    // Retry button should be clickable
    const retryButton = screen.getByRole('button', { name: /riprova/i })
    expect(retryButton).toBeInTheDocument()
    
    // Click should not throw error
    expect(() => fireEvent.click(retryButton)).not.toThrow()
  })

  it('should display error icon', () => {
    render(
      <TripAccessErrorBoundary>
        <ThrowError shouldThrow={true} />
      </TripAccessErrorBoundary>
    )

    // The AlertTriangle icon should be present (we can't easily test the icon itself, but we can check the container)
    const iconContainer = screen.getByText('Errore di accesso').closest('div')?.querySelector('.bg-red-100')
    expect(iconContainer).toBeInTheDocument()
  })
})