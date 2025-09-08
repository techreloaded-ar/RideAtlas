/**
 * Unit tests for DraftAccessRestricted component
 */

import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { DraftAccessRestricted } from '@/components/trips/DraftAccessRestricted'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

describe('DraftAccessRestricted', () => {
  it('should display the main informational message', () => {
    render(<DraftAccessRestricted />)
    
    expect(screen.getByText('Viaggio in preparazione')).toBeInTheDocument()
    expect(screen.getByText('Riprova più tardi')).toBeInTheDocument()
    expect(screen.getByText(/Questo viaggio è ancora in fase di preparazione/)).toBeInTheDocument()
  })

  it('should not expose any trip details for security', () => {
    render(<DraftAccessRestricted />)
    
    // Should not contain any specific trip information
    expect(screen.queryByText(/Viaggio Test/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Toscana/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Mario Rossi/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Creato da/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Destinazione/)).not.toBeInTheDocument()
  })

  it('should include navigation buttons', () => {
    render(<DraftAccessRestricted />)
    
    const backToTripsLink = screen.getByRole('link', { name: /torna ai viaggi/i })
    const homeLink = screen.getByRole('link', { name: /vai alla home/i })
    
    expect(backToTripsLink).toBeInTheDocument()
    expect(backToTripsLink).toHaveAttribute('href', '/trips')
    
    expect(homeLink).toBeInTheDocument()
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('should display helpful information section', () => {
    render(<DraftAccessRestricted />)
    
    expect(screen.getByText(/Cosa succede quando un viaggio è in preparazione/)).toBeInTheDocument()
    expect(screen.getByText(/Il ranger sta completando i dettagli del percorso e verificando tutte le informazioni/)).toBeInTheDocument()
    expect(screen.getByText(/Vengono controllate le informazioni su tappe, punti di interesse e servizi disponibili/)).toBeInTheDocument()
    expect(screen.getByText(/Una volta completato, il viaggio sarà disponibile per tutti gli utenti/)).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<DraftAccessRestricted />)
    
    // Check that headings are properly structured
    const mainHeading = screen.getByRole('heading', { level: 1 })
    expect(mainHeading).toHaveTextContent('Viaggio in preparazione')
    
    const infoHeading = screen.getByRole('heading', { level: 3 })
    expect(infoHeading).toHaveTextContent(/Cosa succede quando un viaggio è in preparazione/)
  })

  it('should have consistent styling classes', () => {
    const { container } = render(<DraftAccessRestricted />)
    
    // Check for main container classes
    expect(container.querySelector('.max-w-4xl')).toBeInTheDocument()
    expect(container.querySelector('.bg-white')).toBeInTheDocument()
    expect(container.querySelector('.border-blue-200')).toBeInTheDocument()
  })

  it('should display clock icon with animation', () => {
    render(<DraftAccessRestricted />)
    
    // The Clock icon should be present with animation class
    const iconContainer = screen.getByText('Viaggio in preparazione').closest('div')?.querySelector('.animate-pulse')
    expect(iconContainer).toBeInTheDocument()
  })

  it('should be a purely informational component without props', () => {
    // Test that the component works without any props
    const { container } = render(<DraftAccessRestricted />)
    
    expect(container).toBeInTheDocument()
    expect(screen.getByText('Viaggio in preparazione')).toBeInTheDocument()
  })

  it('should provide clear user guidance', () => {
    render(<DraftAccessRestricted />)
    
    // Check that the component provides clear guidance to users
    expect(screen.getByText(/Il ranger sta lavorando sui dettagli/)).toBeInTheDocument()
    expect(screen.getByText(/presto sarà disponibile per tutti/)).toBeInTheDocument()
  })

  it('should have proper navigation structure with accessibility', () => {
    render(<DraftAccessRestricted />)
    
    const buttons = screen.getAllByRole('link')
    
    // Should have exactly 3 navigation links (2 main buttons + 1 inline link)
    expect(buttons).toHaveLength(3)
    
    // Check that both main navigation options are present
    expect(screen.getByText(/torna ai viaggi/i)).toBeInTheDocument()
    expect(screen.getByText(/vai alla home/i)).toBeInTheDocument()
    
    // Check that the inline link is present
    expect(screen.getByText(/viaggi disponibili/i)).toBeInTheDocument()
    
    // Check that all links have proper href attributes
    const tripsLink = screen.getByText(/torna ai viaggi/i).closest('a')
    const homeLink = screen.getByText(/vai alla home/i).closest('a')
    const inlineLink = screen.getByText(/viaggi disponibili/i).closest('a')
    
    expect(tripsLink).toHaveAttribute('href', '/trips')
    expect(homeLink).toHaveAttribute('href', '/')
    expect(inlineLink).toHaveAttribute('href', '/trips')
  })

  it('should have enhanced visual design elements', () => {
    const { container } = render(<DraftAccessRestricted />)
    
    // Check for enhanced styling classes
    expect(container.querySelector('.shadow-sm')).toBeInTheDocument()
    expect(container.querySelector('.rounded-xl')).toBeInTheDocument()
    expect(container.querySelector('.bg-gradient-to-br')).toBeInTheDocument()
  })

  it('should include call-to-action link', () => {
    render(<DraftAccessRestricted />)
    
    expect(screen.getByText(/viaggi disponibili/i)).toBeInTheDocument()
    const ctaLink = screen.getByText(/viaggi disponibili/i)
    expect(ctaLink.closest('a')).toHaveAttribute('href', '/trips')
  })
})