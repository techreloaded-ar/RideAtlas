/**
 * Centralized test data factory per eliminare duplicazioni nei test
 * Fornisce metodi standardizzati per creare dati di test consistenti
 */

import { SocialPlatform } from '@/lib/social-links/config';

type SocialLinks = Record<string, string>;

export interface MockUser {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  socialLinks?: SocialLinks | null;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MockTrip {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Factory centralizzata per la creazione di dati di test
 */
export class TestDataFactory {
  private static readonly DEFAULT_USER_DATA: Partial<MockUser> = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    bio: null,
    socialLinks: null,
    role: 'EXPLORER',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  private static readonly DEFAULT_TRIP_DATA: Partial<MockTrip> = {
    id: 'test-trip-id',
    title: 'Test Trip',
    description: 'Test trip description',
    createdBy: 'test-user-id',
    isPublished: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  /**
   * Crea un mock user con dati opzionali
   */
  static createUser(overrides?: Partial<MockUser>): MockUser {
    return {
      ...this.DEFAULT_USER_DATA,
      ...overrides
    } as MockUser;
  }

  /**
   * Crea un mock trip con dati opzionali
   */
  static createTrip(overrides?: Partial<MockTrip>): MockTrip {
    return {
      ...this.DEFAULT_TRIP_DATA,
      ...overrides
    } as MockTrip;
  }

  /**
   * Crea social links validi per i test
   */
  static createValidSocialLinks(): SocialLinks {
    return {
      instagram: 'https://instagram.com/testuser',
      youtube: 'https://youtube.com/@testuser',
      website: 'https://example.com',
      facebook: 'https://facebook.com/testuser'
    };
  }

  /**
   * Crea social links invalidi per test di validazione
   */
  static createInvalidSocialLinks(): SocialLinks {
    return {
      instagram: 'invalid-url',
      youtube: 'not-a-url',
      website: 'missing-protocol.com',
      facebook: 'https://wrong-domain.com/user'
    };
  }

  /**
   * Crea social links parzialmente compilati
   */
  static createPartialSocialLinks(): SocialLinks {
    return {
      instagram: 'https://instagram.com/testuser',
      website: 'https://example.com'
      // Altri campi undefined
    };
  }

  /**
   * Crea social links vuoti
   */
  static createEmptySocialLinks(): SocialLinks {
    return {};
  }

  /**
   * Crea un array di utenti per test di lista
   */
  static createUserList(count: number = 3): MockUser[] {
    return Array.from({ length: count }, (_, index) => 
      this.createUser({
        id: `test-user-${index + 1}`,
        name: `Test User ${index + 1}`,
        email: `test${index + 1}@example.com`
      })
    );
  }

  /**
   * Crea un array di trip per test di lista
   */
  static createTripList(count: number = 3): MockTrip[] {
    return Array.from({ length: count }, (_, index) => 
      this.createTrip({
        id: `test-trip-${index + 1}`,
        title: `Test Trip ${index + 1}`,
        description: `Description for test trip ${index + 1}`
      })
    );
  }

  /**
   * Crea scenari di test predefiniti per social links
   */
  static createSocialLinksScenarios() {
    return {
      valid: this.createValidSocialLinks(),
      invalid: this.createInvalidSocialLinks(),
      partial: this.createPartialSocialLinks(),
      empty: this.createEmptySocialLinks()
    };
  }

  /**
   * Crea mock response per API calls
   */
  static createApiResponse<T>(data: T, success: boolean = true) {
    return {
      success,
      data: success ? data : null,
      error: success ? null : 'Test error message',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Crea mock error response per API calls
   */
  static createApiErrorResponse(message: string = 'Test error', statusCode: number = 400) {
    return {
      success: false,
      data: null,
      error: message,
      statusCode,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Helper per creare mock functions comuni nei test
 */
export class TestMockFactory {
  /**
   * Crea mock function per onChange handlers
   */
  static createOnChangeMock() {
    return jest.fn();
  }

  /**
   * Crea mock function per API calls
   */
  static createApiMock<T>(returnValue?: T) {
    const mock = jest.fn();
    if (returnValue !== undefined) {
      mock.mockResolvedValue(returnValue);
    }
    return mock;
  }

  /**
   * Crea mock function che simula errori
   */
  static createErrorMock(error: Error | string = 'Test error') {
    const mock = jest.fn();
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    mock.mockRejectedValue(errorObj);
    return mock;
  }

  /**
   * Crea mock per console methods (per test che verificano logging)
   */
  static createConsoleMock() {
    return {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn()
    };
  }
}

/**
 * Costanti per test comuni
 */
export const TEST_CONSTANTS = {
  TIMEOUTS: {
    SHORT: 100,
    MEDIUM: 300,
    LONG: 1000
  },
  DELAYS: {
    DEBOUNCE: 300,
    ANIMATION: 200,
    API_CALL: 500
  },
  LIMITS: {
    BIO_MAX_LENGTH: 200,
    TITLE_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 500
  }
} as const;