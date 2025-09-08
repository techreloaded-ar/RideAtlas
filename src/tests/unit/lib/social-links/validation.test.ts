/**
 * Test suite for social links validation utilities
 */

import {
  SocialPlatform,
  validateSocialUrl,
  validateSocialLinks,
  areAllSocialLinksValid,
  getSocialLinksErrors,
  isValidUrlForPlatform,
  getErrorMessageForPlatform
} from '@/lib/social-links';
import { TestDataFactory } from '@/tests/utils/TestDataFactory';

describe('Social Links Validation', () => {
  describe('validateSocialUrl', () => {
    it('should validate Instagram URLs correctly', () => {
      const validInstagram = 'https://instagram.com/username';
      const invalidInstagram = 'https://facebook.com/username';
      
      expect(validateSocialUrl(SocialPlatform.INSTAGRAM, validInstagram)).toEqual({
        isValid: true,
        sanitizedUrl: validInstagram
      });
      
      expect(validateSocialUrl(SocialPlatform.INSTAGRAM, invalidInstagram)).toEqual({
        isValid: false,
        error: "Inserisci un URL Instagram valido (es: https://instagram.com/username)"
      });
    });

    it('should validate YouTube URLs correctly', () => {
      const validYouTube = 'https://youtube.com/@username';
      const invalidYouTube = 'https://instagram.com/username';
      
      expect(validateSocialUrl(SocialPlatform.YOUTUBE, validYouTube)).toEqual({
        isValid: true,
        sanitizedUrl: validYouTube
      });
      
      expect(validateSocialUrl(SocialPlatform.YOUTUBE, invalidYouTube)).toEqual({
        isValid: false,
        error: "Inserisci un URL YouTube valido (es: https://youtube.com/@username)"
      });
    });

    it('should validate LinkedIn URLs correctly', () => {
      const validLinkedIn = 'https://linkedin.com/in/username';
      const validLinkedInCompany = 'https://linkedin.com/company/companyname';
      const invalidLinkedIn = 'https://instagram.com/username';
      
      expect(validateSocialUrl(SocialPlatform.LINKEDIN, validLinkedIn)).toEqual({
        isValid: true,
        sanitizedUrl: validLinkedIn
      });
      
      expect(validateSocialUrl(SocialPlatform.LINKEDIN, validLinkedInCompany)).toEqual({
        isValid: true,
        sanitizedUrl: validLinkedInCompany
      });
      
      expect(validateSocialUrl(SocialPlatform.LINKEDIN, invalidLinkedIn)).toEqual({
        isValid: false,
        error: "Inserisci un URL LinkedIn valido (es: https://linkedin.com/in/username)"
      });
    });

    it('should accept empty URLs as valid', () => {
      expect(validateSocialUrl(SocialPlatform.INSTAGRAM, '')).toEqual({
        isValid: true
      });
      
      expect(validateSocialUrl(SocialPlatform.YOUTUBE, '   ')).toEqual({
        isValid: true
      });
    });
  });

  describe('validateSocialLinks', () => {
    it('should validate multiple social links', () => {
      const socialLinks = {
        instagram: 'https://instagram.com/user',
        youtube: 'https://youtube.com/@user',
        facebook: 'invalid-url'
      };

      const results = validateSocialLinks(socialLinks);
      
      expect(results.instagram.isValid).toBe(true);
      expect(results.youtube.isValid).toBe(true);
      expect(results.facebook.isValid).toBe(false);
      expect(results.facebook.error).toContain('Facebook');
    });
  });

  describe('areAllSocialLinksValid', () => {
    it('should return true when all links are valid', () => {
      const validLinks = {
        instagram: 'https://instagram.com/user',
        youtube: 'https://youtube.com/@user'
      };

      expect(areAllSocialLinksValid(validLinks)).toBe(true);
    });

    it('should return false when any link is invalid', () => {
      const invalidLinks = {
        instagram: 'https://instagram.com/user',
        youtube: 'invalid-url'
      };

      expect(areAllSocialLinksValid(invalidLinks)).toBe(false);
    });
  });

  describe('getSocialLinksErrors', () => {
    it('should return only error messages for invalid links', () => {
      const socialLinks = {
        instagram: 'https://instagram.com/user',
        youtube: 'invalid-url',
        facebook: 'another-invalid-url'
      };

      const errors = getSocialLinksErrors(socialLinks);
      
      expect(errors.instagram).toBeUndefined();
      expect(errors.youtube).toBeDefined();
      expect(errors.facebook).toBeDefined();
    });
  });

  describe('isValidUrlForPlatform', () => {
    it('should validate platform-specific URLs', () => {
      expect(isValidUrlForPlatform(SocialPlatform.INSTAGRAM, 'https://instagram.com/user')).toBe(true);
      expect(isValidUrlForPlatform(SocialPlatform.INSTAGRAM, 'https://facebook.com/user')).toBe(false);
    });
  });

  describe('getErrorMessageForPlatform', () => {
    it('should return appropriate error messages for each platform', () => {
      expect(getErrorMessageForPlatform(SocialPlatform.INSTAGRAM)).toContain('Instagram');
      expect(getErrorMessageForPlatform(SocialPlatform.YOUTUBE)).toContain('YouTube');
      expect(getErrorMessageForPlatform(SocialPlatform.FACEBOOK)).toContain('Facebook');
      expect(getErrorMessageForPlatform(SocialPlatform.LINKEDIN)).toContain('LinkedIn');
    });
  });
});