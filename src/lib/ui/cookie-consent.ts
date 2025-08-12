export enum CookieCategory {
  ESSENTIAL = 'essential',
  FUNCTIONAL = 'functional',
  EXTERNAL_VIDEOS = 'external-videos',
  ANALYTICS = 'analytics'
}

export interface CookieConsentState {
  [CookieCategory.ESSENTIAL]: boolean;
  [CookieCategory.FUNCTIONAL]: boolean;
  [CookieCategory.EXTERNAL_VIDEOS]: boolean;
  [CookieCategory.ANALYTICS]: boolean;
}

const COOKIE_NAME = 'rideatlas-consents';
const COOKIE_EXPIRES_DAYS = 365; // 1 year as per GDPR standards
const DEFAULT_CONSENTS: CookieConsentState = {
  [CookieCategory.ESSENTIAL]: true, // Always true, cannot be disabled
  [CookieCategory.FUNCTIONAL]: false,
  [CookieCategory.EXTERNAL_VIDEOS]: false,
  [CookieCategory.ANALYTICS]: false
};

class CookieConsentService {
  private listeners: Array<(consents: CookieConsentState) => void> = [];
  private consents: CookieConsentState | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadConsents();
    }
  }

  private loadConsents(): void {
    try {
      const stored = this.getCookie(COOKIE_NAME);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.consents = { ...DEFAULT_CONSENTS, ...parsed };
      } else {
        this.consents = { ...DEFAULT_CONSENTS };
      }
    } catch (error) {
      console.warn('Failed to load cookie consents:', error);
      this.consents = { ...DEFAULT_CONSENTS };
    }
  }

  private saveConsents(): void {
    if (typeof window === 'undefined' || !this.consents) return;
    
    try {
      this.setCookie(COOKIE_NAME, JSON.stringify(this.consents), COOKIE_EXPIRES_DAYS);
    } catch (error) {
      console.warn('Failed to save cookie consents:', error);
    }
  }

  private getCookie(name: string): string | null {
    if (typeof window === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue || null;
    }
    return null;
  }

  private setCookie(name: string, value: string, days: number): void {
    if (typeof window === 'undefined') return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    
    const isSecure = window.location.protocol === 'https:';
    const cookieString = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    
    document.cookie = cookieString;
  }

  private deleteCookie(name: string): void {
    if (typeof window === 'undefined') return;
    
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  }

  private notifyListeners(): void {
    if (!this.consents) return;
    this.listeners.forEach(callback => callback({ ...this.consents! }));
  }

  hasConsent(category: CookieCategory): boolean {
    if (typeof window === 'undefined') return false;
    if (!this.consents) this.loadConsents();
    
    // Essential cookies are always allowed
    if (category === CookieCategory.ESSENTIAL) return true;
    
    return this.consents?.[category] ?? DEFAULT_CONSENTS[category];
  }

  setConsent(category: CookieCategory, granted: boolean): void {
    if (typeof window === 'undefined') return;
    if (!this.consents) this.loadConsents();
    
    // Prevent disabling essential cookies
    if (category === CookieCategory.ESSENTIAL && !granted) {
      console.warn('Essential cookies cannot be disabled');
      return;
    }

    if (this.consents) {
      this.consents[category] = granted;
      this.saveConsents();
      this.notifyListeners();
    }
  }

  getAllConsents(): CookieConsentState {
    if (typeof window === 'undefined') return { ...DEFAULT_CONSENTS };
    if (!this.consents) this.loadConsents();
    return { ...this.consents! };
  }

  setAllConsents(consents: Partial<CookieConsentState>): void {
    if (typeof window === 'undefined') return;
    if (!this.consents) this.loadConsents();

    if (this.consents) {
      // Merge with existing consents, ensuring essential is always true
      this.consents = {
        ...this.consents,
        ...consents,
        [CookieCategory.ESSENTIAL]: true
      };
      this.saveConsents();
      this.notifyListeners();
    }
  }

  resetConsents(): void {
    if (typeof window === 'undefined') return;
    
    this.consents = { ...DEFAULT_CONSENTS };
    try {
      this.deleteCookie(COOKIE_NAME);
    } catch (error) {
      console.warn('Failed to clear cookie consents:', error);
    }
    this.notifyListeners();
  }

  onConsentChange(callback: (consents: CookieConsentState) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  hasConsentBannerBeenShown(): boolean {
    if (typeof window === 'undefined') return false;
    return this.getCookie(COOKIE_NAME) !== null;
  }
}

// Export singleton instance
export const cookieConsentService = new CookieConsentService();