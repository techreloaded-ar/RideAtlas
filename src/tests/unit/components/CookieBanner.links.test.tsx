import { render, screen } from '@testing-library/react'
import CookieBanner from '@/components/ui/CookieBanner'

describe('CookieBanner - Privacy Policy Link', () => {
  beforeEach(() => {
    // Mock document.cookie to simulate no consent cookie exists
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '' // Simula nessun cookie presente - forza il banner a mostrarsi
    });
  });
  it('privacy policy link points to correct URL', () => {
    render(<CookieBanner />)
    
    // Check that the "Informativa Privacy" link points to the correct page
    const privacyLink = screen.getByRole('link', { name: /informativa privacy/i })
    expect(privacyLink).toHaveAttribute('href', '/privacy-policy')
  })

  it('cookie banner renders essential elements', () => {
    render(<CookieBanner />)
    
    // Check essential cookie banner elements - usa getByText invece di getByRole per i bottoni
    expect(screen.getByText('Accetta tutti i cookie')).toBeInTheDocument()
    expect(screen.getByText('Rifiuta cookie non essenziali')).toBeInTheDocument()
    expect(screen.getByText(/questo sito utilizza cookie/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /informativa privacy/i })).toBeInTheDocument()
  })
})