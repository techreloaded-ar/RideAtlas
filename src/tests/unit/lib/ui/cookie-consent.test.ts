import { cookieConsentService, CookieCategory } from '@/lib/ui/cookie-consent';

// Mock document.cookie
const mockCookies = (() => {
  let cookies: Record<string, string> = {};

  const mock = {
    get cookie() {
      return Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
    },
    set cookie(cookieString: string) {
      const [assignment] = cookieString.split(';');
      const [key, value] = assignment.split('=');
      
      if (value && value.trim() !== '' && !cookieString.includes('expires=Thu, 01 Jan 1970')) {
        // Set cookie
        cookies[key] = value;
      } else {
        // Delete cookie (empty value or past expiration)
        delete cookies[key];
      }
    },
    // Utilities for testing
    clear: () => { cookies = {}; },
    getCookies: () => ({ ...cookies }),
    setCookie: (key: string, value: string) => { cookies[key] = value; }
  };

  return mock;
})();

Object.defineProperty(document, 'cookie', {
  get: () => mockCookies.cookie,
  set: (value) => { mockCookies.cookie = value; },
  configurable: true
});

// Mock window.location for secure cookie tests
Object.defineProperty(window, 'location', {
  value: {
    protocol: 'https:'
  },
  writable: true
});

describe('CookieConsentService - GDPR Compliance Tests', () => {
  beforeEach(() => {
    // Clear all cookies
    mockCookies.clear();
    jest.clearAllMocks();

    // Reset service state first
    cookieConsentService.resetConsents();

    // Force the service to reset its internal consents state
    // by accessing a private property (hack for testing)
    (cookieConsentService as any).consents = null;
  });

  describe('🔐 Default Consent Behavior', () => {
    it('should have essential cookies always enabled', () => {
      expect(cookieConsentService.hasConsent(CookieCategory.ESSENTIAL)).toBe(true);
    });

    it('should have non-essential cookies disabled by default', () => {
      expect(cookieConsentService.hasConsent(CookieCategory.FUNCTIONAL)).toBe(false);
      expect(cookieConsentService.hasConsent(CookieCategory.EXTERNAL_VIDEOS)).toBe(false);
      expect(cookieConsentService.hasConsent(CookieCategory.ANALYTICS)).toBe(false);
    });

    it('should return false for non-essential cookies in SSR context', () => {
      // Simulate server-side rendering
      const originalWindow = global.window;
      // @ts-expect-error - Reset private state for test isolation
      delete global.window;

      expect(cookieConsentService.hasConsent(CookieCategory.EXTERNAL_VIDEOS)).toBe(false);
      
      global.window = originalWindow;
    });
  });

  describe('📝 Consent Management', () => {
    it('should set and retrieve consent for external videos', () => {
      cookieConsentService.setConsent(CookieCategory.EXTERNAL_VIDEOS, true);
      expect(cookieConsentService.hasConsent(CookieCategory.EXTERNAL_VIDEOS)).toBe(true);
    });

    it('should prevent disabling essential cookies', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      cookieConsentService.setConsent(CookieCategory.ESSENTIAL, false);
      
      expect(cookieConsentService.hasConsent(CookieCategory.ESSENTIAL)).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Essential cookies cannot be disabled');
      
      consoleSpy.mockRestore();
    });

    it('should persist consent changes to cookies', () => {
      cookieConsentService.setConsent(CookieCategory.EXTERNAL_VIDEOS, true);
      
      const cookies = mockCookies.getCookies();
      expect(cookies['rideatlas-consents']).toContain('"external-videos":true');
    });

    it('should set multiple consents at once', () => {
      cookieConsentService.setAllConsents({
        [CookieCategory.FUNCTIONAL]: true,
        [CookieCategory.EXTERNAL_VIDEOS]: true,
        [CookieCategory.ANALYTICS]: false,
      });

      expect(cookieConsentService.hasConsent(CookieCategory.FUNCTIONAL)).toBe(true);
      expect(cookieConsentService.hasConsent(CookieCategory.EXTERNAL_VIDEOS)).toBe(true);
      expect(cookieConsentService.hasConsent(CookieCategory.ANALYTICS)).toBe(false);
      expect(cookieConsentService.hasConsent(CookieCategory.ESSENTIAL)).toBe(true);
    });
  });

  describe('🔄 Persistence and Recovery', () => {
    it('should load consent from cookies on initialization', () => {
      const storedConsents = {
        [CookieCategory.ESSENTIAL]: true,
        [CookieCategory.FUNCTIONAL]: true,
        [CookieCategory.EXTERNAL_VIDEOS]: false,
        [CookieCategory.ANALYTICS]: true,
      };

      // Set cookie directly
      mockCookies.setCookie('rideatlas-consents', JSON.stringify(storedConsents));

      // Force reload by resetting internal state
      (cookieConsentService as any).consents = null;

      // Now check that stored values are loaded
      expect(cookieConsentService.hasConsent(CookieCategory.FUNCTIONAL)).toBe(true);
      expect(cookieConsentService.hasConsent(CookieCategory.EXTERNAL_VIDEOS)).toBe(false);
      expect(cookieConsentService.hasConsent(CookieCategory.ANALYTICS)).toBe(true);
    });

    it('should handle corrupted cookie data gracefully', () => {
      // Reset internal state and set corrupted data
      (cookieConsentService as any).consents = null;
      mockCookies.setCookie('rideatlas-consents', 'invalid-json');
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Force loading by calling hasConsent which triggers loadConsents
      const result = cookieConsentService.hasConsent(CookieCategory.EXTERNAL_VIDEOS);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load cookie consents:',
        expect.any(Error)
      );

      // Should fall back to defaults
      expect(result).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should reset all consents to defaults', () => {
      // Set some consents
      cookieConsentService.setConsent(CookieCategory.EXTERNAL_VIDEOS, true);
      cookieConsentService.setConsent(CookieCategory.ANALYTICS, true);

      // Reset
      cookieConsentService.resetConsents();

      expect(cookieConsentService.hasConsent(CookieCategory.EXTERNAL_VIDEOS)).toBe(false);
      expect(cookieConsentService.hasConsent(CookieCategory.ANALYTICS)).toBe(false);
      expect(cookieConsentService.hasConsent(CookieCategory.ESSENTIAL)).toBe(true);
      
      // Cookie should be deleted
      const cookies = mockCookies.getCookies();
      expect(cookies['rideatlas-consents']).toBeUndefined();
    });
  });

  describe('📢 Event System', () => {
    it('should notify listeners when consent changes', () => {
      const mockListener = jest.fn();
      const unsubscribe = cookieConsentService.onConsentChange(mockListener);

      cookieConsentService.setConsent(CookieCategory.EXTERNAL_VIDEOS, true);

      expect(mockListener).toHaveBeenCalledWith({
        [CookieCategory.ESSENTIAL]: true,
        [CookieCategory.FUNCTIONAL]: false,
        [CookieCategory.EXTERNAL_VIDEOS]: true,
        [CookieCategory.ANALYTICS]: false,
      });

      unsubscribe();
    });

    it('should allow unsubscribing from consent changes', () => {
      const mockListener = jest.fn();
      const unsubscribe = cookieConsentService.onConsentChange(mockListener);

      unsubscribe();
      cookieConsentService.setConsent(CookieCategory.EXTERNAL_VIDEOS, true);

      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('🏛️ GDPR Compliance Verification', () => {
    it('should track that user has interacted with consent banner', () => {
      // Ensure cookies are truly empty
      expect(mockCookies.getCookies()['rideatlas-consents']).toBeUndefined();

      // Initially no consent has been given
      expect(cookieConsentService.hasConsentBannerBeenShown()).toBe(false);

      // After setting any consent, banner should be considered as shown
      cookieConsentService.setConsent(CookieCategory.EXTERNAL_VIDEOS, false);

      // Verify that cookie was set
      const cookies = mockCookies.getCookies();
      expect(cookies['rideatlas-consents']).toBeDefined();

      expect(cookieConsentService.hasConsentBannerBeenShown()).toBe(true);
    });

    it('should provide granular consent control per category', () => {
      const categories = [
        CookieCategory.ESSENTIAL,
        CookieCategory.FUNCTIONAL, 
        CookieCategory.EXTERNAL_VIDEOS,
        CookieCategory.ANALYTICS,
      ];

      categories.forEach(category => {
        expect(typeof cookieConsentService.hasConsent(category)).toBe('boolean');
      });
    });

    it('should maintain consent state immutability in getAllConsents', () => {
      const consents1 = cookieConsentService.getAllConsents();
      const consents2 = cookieConsentService.getAllConsents();
      
      expect(consents1).not.toBe(consents2); // Different objects
      expect(consents1).toEqual(consents2); // Same content

      // Modifying returned object should not affect internal state
      consents1[CookieCategory.EXTERNAL_VIDEOS] = true;
      expect(cookieConsentService.hasConsent(CookieCategory.EXTERNAL_VIDEOS)).toBe(false);
    });
  });
});