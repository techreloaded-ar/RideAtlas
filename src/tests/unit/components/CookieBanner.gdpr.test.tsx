import { render, screen, fireEvent, waitFor } from '../../setup/test-utils';
import CookieBanner from '@/components/ui/CookieBanner';
import { cookieConsentService, CookieCategory } from '@/lib/cookie-consent';

// Mock cookie consent service
jest.mock('@/lib/cookie-consent', () => ({
  cookieConsentService: {
    hasConsentBannerBeenShown: jest.fn(),
    onConsentChange: jest.fn().mockReturnValue(() => {}),
    setAllConsents: jest.fn(),
    setConsent: jest.fn(),
    getAllConsents: jest.fn(),
    resetConsents: jest.fn(),
  },
  CookieCategory: {
    ESSENTIAL: 'essential',
    FUNCTIONAL: 'functional',
    EXTERNAL_VIDEOS: 'external-videos',
    ANALYTICS: 'analytics',
  }
}));

const mockCookieConsentService = cookieConsentService as jest.Mocked<typeof cookieConsentService>;

describe('CookieBanner - GDPR Granular Controls', () => {
  const mockDefaultConsents = {
    [CookieCategory.ESSENTIAL]: true,
    [CookieCategory.FUNCTIONAL]: false,
    [CookieCategory.EXTERNAL_VIDEOS]: false,
    [CookieCategory.ANALYTICS]: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCookieConsentService.onConsentChange.mockReturnValue(() => {});
    mockCookieConsentService.getAllConsents.mockReturnValue(mockDefaultConsents);
  });

  describe('🎭 Banner Visibility Logic', () => {
    it('should show banner when user has not interacted before', () => {
      mockCookieConsentService.hasConsentBannerBeenShown.mockReturnValue(false);

      render(<CookieBanner />);

      expect(screen.getByText('Utilizzo dei Cookie')).toBeInTheDocument();
      expect(screen.getByText('Accetta tutti')).toBeInTheDocument();
      expect(screen.getByText('Rifiuta opzionali')).toBeInTheDocument();
    });

    it('should not show banner when user has already made choice', () => {
      mockCookieConsentService.hasConsentBannerBeenShown.mockReturnValue(true);

      const { container } = render(<CookieBanner />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('🔧 Simple Banner Actions', () => {
    beforeEach(() => {
      mockCookieConsentService.hasConsentBannerBeenShown.mockReturnValue(false);
    });

    it('should accept all cookies when "Accept All" clicked', () => {
      render(<CookieBanner />);

      const acceptAllButton = screen.getByText('Accetta tutti');
      fireEvent.click(acceptAllButton);

      expect(mockCookieConsentService.setAllConsents).toHaveBeenCalledWith({
        [CookieCategory.FUNCTIONAL]: true,
        [CookieCategory.EXTERNAL_VIDEOS]: true,
        [CookieCategory.ANALYTICS]: true,
      });
    });

    it('should reject non-essential cookies when "Reject Optional" clicked', () => {
      render(<CookieBanner />);

      const rejectButton = screen.getByText('Rifiuta opzionali');
      fireEvent.click(rejectButton);

      expect(mockCookieConsentService.setAllConsents).toHaveBeenCalledWith({
        [CookieCategory.FUNCTIONAL]: false,
        [CookieCategory.EXTERNAL_VIDEOS]: false,
        [CookieCategory.ANALYTICS]: false,
      });
    });

    it('should open detailed settings when "Customize" clicked', () => {
      render(<CookieBanner />);

      const customizeButton = screen.getByText('Personalizza');
      fireEvent.click(customizeButton);

      // Should show detailed settings view
      expect(screen.getByText('Impostazioni Cookie')).toBeInTheDocument();
      expect(screen.getByText('Cookie Essenziali')).toBeInTheDocument();
      expect(screen.getByText('Cookie Funzionali')).toBeInTheDocument();
      expect(screen.getByText('Video Esterni')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should close banner when X button clicked (equivalent to reject)', () => {
      render(<CookieBanner />);

      const closeButton = screen.getByLabelText('Chiudi banner');
      fireEvent.click(closeButton);

      expect(mockCookieConsentService.setAllConsents).toHaveBeenCalledWith({
        [CookieCategory.FUNCTIONAL]: false,
        [CookieCategory.EXTERNAL_VIDEOS]: false,
        [CookieCategory.ANALYTICS]: false,
      });
    });
  });

  describe('⚙️ Detailed Settings View', () => {
    beforeEach(() => {
      mockCookieConsentService.hasConsentBannerBeenShown.mockReturnValue(false);
    });

    it('should show all cookie categories with proper descriptions', () => {
      render(<CookieBanner />);
      
      // Open detailed settings
      fireEvent.click(screen.getByText('Personalizza'));

      // Essential cookies
      expect(screen.getByText('Cookie Essenziali')).toBeInTheDocument();
      expect(screen.getByText(/necessari per il funzionamento base del sito/i)).toBeInTheDocument();
      expect(screen.getByText('Sempre attivi')).toBeInTheDocument();

      // Functional cookies
      expect(screen.getByText('Cookie Funzionali')).toBeInTheDocument();
      expect(screen.getByText(/migliorano l'esperienza utente/i)).toBeInTheDocument();

      // External videos
      expect(screen.getByText('Video Esterni')).toBeInTheDocument();
      expect(screen.getByText(/permette di visualizzare video YouTube/i)).toBeInTheDocument();

      // Analytics
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText(/ci aiutano a capire come migliorare il sito/i)).toBeInTheDocument();
    });

    it('should show essential cookies as always enabled', () => {
      render(<CookieBanner />);
      
      fireEvent.click(screen.getByText('Personalizza'));

      // Essential cookies section should not have toggle
      const essentialSection = screen.getByText('Cookie Essenziali').closest('div');
      const checkboxes = screen.queryAllByRole('checkbox');
      const essentialCheckbox = checkboxes.find(checkbox => essentialSection?.contains(checkbox));
      expect(essentialCheckbox).toBeUndefined();
    });

    it('should allow toggling non-essential cookies', async () => {
      render(<CookieBanner />);
      
      fireEvent.click(screen.getByText('Personalizza'));

      // Find and click functional cookies toggle
      const functionalToggles = screen.getAllByRole('checkbox');
      const functionalToggle = functionalToggles.find((toggle, index) => {
        const section = toggle.closest('.bg-gray-800\\/50');
        return section?.textContent?.includes('Cookie Funzionali');
      });

      expect(functionalToggle).toBeInTheDocument();
      
      if (functionalToggle) {
        fireEvent.click(functionalToggle);
        
        expect(mockCookieConsentService.setConsent).toHaveBeenCalledWith(
          CookieCategory.FUNCTIONAL,
          true
        );
      }
    });

    it('should save custom settings when "Save Settings" clicked', () => {
      render(<CookieBanner />);
      
      fireEvent.click(screen.getByText('Personalizza'));
      
      const saveButton = screen.getByText('Salva impostazioni');
      fireEvent.click(saveButton);

      // Should close the detailed view and banner
      expect(screen.queryByText('Impostazioni Cookie')).not.toBeInTheDocument();
    });

    it('should return to simple view when X clicked in detailed settings', () => {
      render(<CookieBanner />);
      
      fireEvent.click(screen.getByText('Personalizza'));
      
      const backButton = screen.getByLabelText('Torna alle opzioni base');
      fireEvent.click(backButton);

      // Should show simple banner again
      expect(screen.getByText('Utilizzo dei Cookie')).toBeInTheDocument();
      expect(screen.queryByText('Impostazioni Cookie')).not.toBeInTheDocument();
    });
  });

  describe('🔗 Legal Links', () => {
    beforeEach(() => {
      mockCookieConsentService.hasConsentBannerBeenShown.mockReturnValue(false);
    });

    it('should have privacy policy link in simple view', () => {
      render(<CookieBanner />);

      const privacyLink = screen.getByText('Informativa Privacy');
      expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
    });

    // Note: Privacy link is only available in simple view, not in detailed view
  });

  describe('🏛️ GDPR Compliance Features', () => {
    beforeEach(() => {
      mockCookieConsentService.hasConsentBannerBeenShown.mockReturnValue(false);
    });

    it('should provide clear information about cookie usage', () => {
      render(<CookieBanner />);

      expect(screen.getByText(/questo sito utilizza cookie/i)).toBeInTheDocument();
      expect(screen.getByText(/cookie essenziali sono sempre attivi/i)).toBeInTheDocument();
    });

    it('should offer granular control over cookie categories', () => {
      render(<CookieBanner />);
      
      fireEvent.click(screen.getByText('Personalizza'));

      // Each non-essential category should have individual control
      const toggles = screen.getAllByRole('checkbox');
      
      // Should have toggles for functional, external-videos, and analytics
      // (Essential doesn't have toggle)
      expect(toggles.length).toBeGreaterThanOrEqual(3);
    });

    it('should explain what each cookie category does', () => {
      render(<CookieBanner />);
      
      fireEvent.click(screen.getByText('Personalizza'));

      // Each category should have clear description
      expect(screen.getByText(/login, navigazione/i)).toBeInTheDocument();
      expect(screen.getByText(/preferenze, impostazioni/i)).toBeInTheDocument();
      expect(screen.getByText(/video YouTube embedded/i)).toBeInTheDocument();
      expect(screen.getByText(/come migliorare il sito/i)).toBeInTheDocument();
    });

    it('should allow rejecting all non-essential cookies', () => {
      render(<CookieBanner />);

      const rejectButton = screen.getByText('Rifiuta opzionali');
      fireEvent.click(rejectButton);

      // Should set all non-essential to false
      const expectedConsents = {
        [CookieCategory.FUNCTIONAL]: false,
        [CookieCategory.EXTERNAL_VIDEOS]: false,
        [CookieCategory.ANALYTICS]: false,
      };

      expect(mockCookieConsentService.setAllConsents).toHaveBeenCalledWith(expectedConsents);
    });

    it('should make consent decision permanent (not show banner again)', () => {
      render(<CookieBanner />);

      fireEvent.click(screen.getByText('Accetta tutti'));

      // Banner should disappear after decision
      expect(screen.queryByText('Utilizzo dei Cookie')).not.toBeInTheDocument();
    });
  });

  describe('📱 Responsive Design', () => {
    beforeEach(() => {
      mockCookieConsentService.hasConsentBannerBeenShown.mockReturnValue(false);
    });

    it('should render banner with responsive classes', () => {
      render(<CookieBanner />);

      const banner = screen.getByText('Utilizzo dei Cookie').closest('.fixed');
      expect(banner).toHaveClass('fixed', 'inset-x-0', 'bottom-0');
    });

    it('should have mobile-friendly button layout', () => {
      render(<CookieBanner />);

      const buttonContainer = screen.getByText('Accetta tutti').closest('.flex');
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row');
    });
  });
});