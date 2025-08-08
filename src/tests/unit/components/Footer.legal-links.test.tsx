import { render, screen } from '@testing-library/react'
import Footer from '@/components/layout/Footer'

describe('Footer - Legal Links', () => {
  it('has correct legal page links', () => {
    render(<Footer />)
    
    // Check Privacy Policy link
    const privacyLink = screen.getByRole('link', { name: /privacy policy/i })
    expect(privacyLink).toHaveAttribute('href', '/privacy-policy')
    
    // Check Terms of Service link
    const termsLink = screen.getByRole('link', { name: /termini di servizio/i })
    expect(termsLink).toHaveAttribute('href', '/terms-of-service')
    
    // Check Cookie Policy link
    const cookieLink = screen.getByRole('link', { name: /cookie policy/i })
    expect(cookieLink).toHaveAttribute('href', '/cookie-policy')
  })

  it('legal links are in the support section', () => {
    render(<Footer />)
    
    // Find the support section
    const supportSection = screen.getByRole('heading', { name: /supporto/i }).closest('div')
    
    // Check that legal links are within the support section
    expect(supportSection).toContainElement(screen.getByRole('link', { name: /privacy policy/i }))
    expect(supportSection).toContainElement(screen.getByRole('link', { name: /termini di servizio/i }))
    expect(supportSection).toContainElement(screen.getByRole('link', { name: /cookie policy/i }))
  })
})