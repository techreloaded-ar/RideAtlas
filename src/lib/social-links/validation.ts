/**
 * Social links validation utilities
 * Provides validation functions for social media URLs
 */

import { SocialPlatform, SOCIAL_VALIDATORS, getSocialPlatformConfig } from './config';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedUrl?: string;
}

/**
 * Validate a URL for a specific social platform
 */
export function validateSocialUrl(platform: SocialPlatform, url: string): ValidationResult {
  // Empty URLs are considered valid (optional fields)
  if (!url || url.trim() === '') {
    return { isValid: true };
  }

  const trimmedUrl = url.trim();
  const config = getSocialPlatformConfig(platform);
  
  // Validate URL format
  if (!config.validator(trimmedUrl)) {
    return {
      isValid: false,
      error: config.errorMessage
    };
  }

  return {
    isValid: true,
    sanitizedUrl: trimmedUrl
  };
}

/**
 * Validate multiple social URLs
 */
export function validateSocialLinks(socialLinks: Record<string, string>): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};

  for (const [platform, url] of Object.entries(socialLinks)) {
    if (Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
      results[platform] = validateSocialUrl(platform as SocialPlatform, url);
    } else {
      results[platform] = {
        isValid: false,
        error: `Piattaforma social non supportata: ${platform}`
      };
    }
  }

  return results;
}

/**
 * Check if all social links are valid
 */
export function areAllSocialLinksValid(socialLinks: Record<string, string>): boolean {
  const validationResults = validateSocialLinks(socialLinks);
  return Object.values(validationResults).every(result => result.isValid);
}

/**
 * Get validation errors for social links
 */
export function getSocialLinksErrors(socialLinks: Record<string, string>): Record<string, string> {
  const validationResults = validateSocialLinks(socialLinks);
  const errors: Record<string, string> = {};

  for (const [platform, result] of Object.entries(validationResults)) {
    if (!result.isValid && result.error) {
      errors[platform] = result.error;
    }
  }

  return errors;
}

/**
 * Validate a single URL against a specific platform pattern
 */
export function isValidUrlForPlatform(platform: SocialPlatform, url: string): boolean {
  if (!url || url.trim() === '') {
    return true; // Empty URLs are valid
  }

  const validator = SOCIAL_VALIDATORS[platform];
  return validator.pattern.test(url.trim());
}

/**
 * Get error message for a specific platform
 */
export function getErrorMessageForPlatform(platform: SocialPlatform): string {
  return SOCIAL_VALIDATORS[platform].message;
}