/**
 * Test data factory for profile update integration tests
 */

import { MockUser, MockSession, SocialLinks, ProfileUpdateRequest } from './types';
import { TEST_CONSTANTS } from './constants';

export class ProfileTestDataFactory {
  /**
   * Creates a mock user with optional overrides
   */
  static createMockUser(overrides: Partial<MockUser> = {}): MockUser {
    return {
      id: TEST_CONSTANTS.MOCK_USER_ID,
      name: 'Test User',
      bio: null,
      email: TEST_CONSTANTS.MOCK_EMAIL,
      socialLinks: null,
      ...overrides
    };
  }

  /**
   * Creates a mock session for authenticated requests
   */
  static createMockSession(userId: string = TEST_CONSTANTS.MOCK_USER_ID): MockSession {
    return {
      user: { id: userId }
    };
  }

  /**
   * Creates valid social links for testing
   */
  static createValidSocialLinks(): SocialLinks {
    return { ...TEST_CONSTANTS.VALID_SOCIAL_LINKS };
  }

  /**
   * Creates a basic profile update request
   */
  static createProfileUpdateRequest(overrides: Partial<ProfileUpdateRequest> = {}): ProfileUpdateRequest {
    return {
      name: 'Test User',
      ...overrides
    };
  }

  /**
   * Creates social links with missing protocol for sanitization testing
   */
  static createUnsanitizedSocialLinks(): SocialLinks {
    return {
      instagram: 'instagram.com/testuser',
      website: 'example.com'
    };
  }

  /**
   * Creates expected sanitized social links
   */
  static createSanitizedSocialLinks(): SocialLinks {
    return {
      instagram: 'https://instagram.com/testuser',
      website: 'https://example.com/'
    };
  }

  /**
   * Creates empty social links object
   */
  static createEmptySocialLinks(): SocialLinks {
    return {
      instagram: '',
      youtube: '',
      facebook: '',
      tiktok: '',
      linkedin: '',
      website: ''
    };
  }

  /**
   * Creates partial social links for testing partial updates
   */
  static createPartialSocialLinks(): SocialLinks {
    return {
      instagram: 'https://instagram.com/testuser',
      youtube: '', // Empty - should be removed
      facebook: 'https://facebook.com/testuser'
      // linkedin, tiktok, website not provided
    };
  }

  /**
   * Creates expected result for partial social links
   */
  static createExpectedPartialSocialLinks(): SocialLinks {
    return {
      instagram: 'https://instagram.com/testuser',
      facebook: 'https://facebook.com/testuser'
    };
  }

  /**
   * Creates a bio that exceeds the maximum length
   */
  static createTooLongBio(): string {
    return 'a'.repeat(TEST_CONSTANTS.MAX_BIO_LENGTH + 1);
  }

  /**
   * Creates malformed JSON string for error testing
   */
  static createMalformedJson(): string {
    return 'invalid json';
  }
}