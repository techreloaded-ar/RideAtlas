/**
 * Test suite for social links sanitization utilities
 */

import {
  SocialPlatform,
  sanitizeUrl,
  sanitizeSocialUrl,
  sanitizeSocialLinks,
  extractUsernameFromUrl
} from '@/lib/social-links';

describe('Social Links Sanitization', () => {
  describe('sanitizeUrl', () => {
    it('should remove dangerous characters', () => {
      const dangerousUrl = 'https://example.com/<script>alert("xss")</script>';
      const sanitized = sanitizeUrl(dangerousUrl);
      
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain('"');
    });

    it('should add https protocol if missing', () => {
      expect(sanitizeUrl('example.com')).toBe('https://example.com');
      expect(sanitizeUrl('www.example.com')).toBe('https://www.example.com');
    });

    it('should preserve existing protocol', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
    });

    it('should handle empty or invalid input', () => {
      expect(sanitizeUrl('')).toBe('');
      expect(sanitizeUrl(null as any)).toBe('');
      expect(sanitizeUrl(undefined as any)).toBe('');
    });
  });

  describe('sanitizeSocialUrl', () => {
    it('should sanitize Instagram URLs', () => {
      const url = 'https://www.instagram.com/username/?hl=en';
      const sanitized = sanitizeSocialUrl(SocialPlatform.INSTAGRAM, url);
      
      expect(sanitized).toBe('https://instagram.com/username');
    });

    it('should sanitize YouTube URLs', () => {
      const url = 'https://www.youtube.com/@username?tab=videos';
      const sanitized = sanitizeSocialUrl(SocialPlatform.YOUTUBE, url);
      
      expect(sanitized).toBe('https://youtube.com/@username');
    });

    it('should sanitize LinkedIn URLs', () => {
      const linkedinUrl = 'https://www.linkedin.com/in/username?ref=src';
      const companyUrl = 'https://linkedin.com/company/companyname/';
      
      expect(sanitizeSocialUrl(SocialPlatform.LINKEDIN, linkedinUrl)).toBe('https://linkedin.com/in/username');
      expect(sanitizeSocialUrl(SocialPlatform.LINKEDIN, companyUrl)).toBe('https://linkedin.com/company/companyname');
    });
  });

  describe('sanitizeSocialLinks', () => {
    it('should sanitize multiple social links', () => {
      const socialLinks = {
        instagram: 'https://www.instagram.com/user/?hl=en',
        youtube: 'https://www.youtube.com/@user?tab=videos',
        website: '  https://example.com/  '
      };

      const sanitized = sanitizeSocialLinks(socialLinks);
      
      expect(sanitized.instagram).toBe('https://instagram.com/user');
      expect(sanitized.youtube).toBe('https://youtube.com/@user');
      expect(sanitized.website).toBe('https://example.com');
    });
  });

  describe('extractUsernameFromUrl', () => {
    it('should extract Instagram username', () => {
      const url = 'https://instagram.com/username';
      expect(extractUsernameFromUrl(SocialPlatform.INSTAGRAM, url)).toBe('username');
    });

    it('should extract YouTube username from different formats', () => {
      expect(extractUsernameFromUrl(SocialPlatform.YOUTUBE, 'https://youtube.com/@username')).toBe('username');
      expect(extractUsernameFromUrl(SocialPlatform.YOUTUBE, 'https://youtube.com/c/username')).toBe('username');
      expect(extractUsernameFromUrl(SocialPlatform.YOUTUBE, 'https://youtube.com/channel/username')).toBe('username');
    });

    it('should extract TikTok username', () => {
      const url = 'https://tiktok.com/@username';
      expect(extractUsernameFromUrl(SocialPlatform.TIKTOK, url)).toBe('username');
    });

    it('should extract LinkedIn username', () => {
      const personalUrl = 'https://linkedin.com/in/username';
      const companyUrl = 'https://linkedin.com/company/companyname';
      expect(extractUsernameFromUrl(SocialPlatform.LINKEDIN, personalUrl)).toBe('username');
      expect(extractUsernameFromUrl(SocialPlatform.LINKEDIN, companyUrl)).toBe('companyname');
    });

    it('should extract domain for websites', () => {
      const url = 'https://example.com/path';
      expect(extractUsernameFromUrl(SocialPlatform.WEBSITE, url)).toBe('example.com');
    });

    it('should return null for invalid URLs', () => {
      expect(extractUsernameFromUrl(SocialPlatform.INSTAGRAM, 'invalid-url')).toBe(null);
      expect(extractUsernameFromUrl(SocialPlatform.INSTAGRAM, '')).toBe(null);
    });
  });
});