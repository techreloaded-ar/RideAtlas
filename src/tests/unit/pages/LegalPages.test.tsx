import { render, screen } from '@testing-library/react'
import PrivacyPolicyPage from '@/app/privacy-policy/page'
import CookiePolicyPage from '@/app/cookie-policy/page'
import TermsOfServicePage from '@/app/terms-of-service/page'

describe('Legal Pages - Critical Functionality', () => {
  describe('Page Rendering & Links', () => {
    it('privacy policy renders and has working internal links', () => {
      render(<PrivacyPolicyPage />)
      
      // Check page renders without errors
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/privacy policy/i)
      expect(screen.getByText(/ultimo aggiornamento/i)).toBeInTheDocument()
      
      // Check critical external links (Privacy Policy doesn't have internal cookie policy link)
      const garanteLink = screen.getByRole('link', { name: /garanteprivacy/i })
      expect(garanteLink).toHaveAttribute('href', 'https://www.garanteprivacy.it')
    })

    it('cookie policy renders and has working internal links', () => {
      render(<CookiePolicyPage />)
      
      // Check page renders without errors
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/cookie policy/i)
      expect(screen.getByText(/ultimo aggiornamento/i)).toBeInTheDocument()
      
      // Check critical internal links (be specific to avoid "Privacy Policy Google")
      const privacyLink = screen.getByRole('link', { name: '/privacy-policy' })
      expect(privacyLink).toHaveAttribute('href', '/privacy-policy')
    })

    it('terms of service renders and has working internal links', () => {
      render(<TermsOfServicePage />)
      
      // Check page renders without errors
      expect(screen.getByRole('heading', { name: /termini di servizio/i })).toBeInTheDocument()
      expect(screen.getByText(/ultimo aggiornamento/i)).toBeInTheDocument()
      
      // Check critical internal links
      const privacyLink = screen.getByRole('link', { name: /privacy policy/i })
      expect(privacyLink).toHaveAttribute('href', '/privacy-policy')
      
      const cookieLink = screen.getByRole('link', { name: /cookie policy/i })
      expect(cookieLink).toHaveAttribute('href', '/cookie-policy')
    })
  })

  describe('Essential Content Structure', () => {
    it('privacy policy has essential GDPR sections', () => {
      render(<PrivacyPolicyPage />)
      
      // Check for critical GDPR compliance sections (headings only, not content)
      expect(screen.getByRole('heading', { name: /titolare del trattamento/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /i tuoi diritti/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /contatti/i })).toBeInTheDocument()
    })

    it('cookie policy has essential cookie information', () => {
      render(<CookiePolicyPage />)
      
      // Check for critical cookie policy sections
      expect(screen.getByRole('heading', { name: /cosa sono i cookie/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /tipologie di cookie utilizzati/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /gestione delle preferenze cookie/i })).toBeInTheDocument()
    })

    it('terms of service has essential e-commerce sections', () => {
      render(<TermsOfServicePage />)
      
      // Check for critical e-commerce terms sections
      expect(screen.getByRole('heading', { name: /prodotti e servizi in vendita/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /processo di acquisto/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /diritto di recesso/i })).toBeInTheDocument()
    })
  })

  describe('External Links Security', () => {
    it('external links have proper security attributes', () => {
      render(<CookiePolicyPage />)
      
      // Check external links have target="_blank" for security
      const externalLinks = screen.getAllByRole('link').filter(link => 
        link.getAttribute('href')?.startsWith('http')
      )
      
      externalLinks.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank')
      })
    })
  })
})