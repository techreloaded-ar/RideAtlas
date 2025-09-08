/**
 * Social Links utilities - Main export file
 * Provides centralized access to all social links functionality
 */

// Configuration exports
export {
  SocialPlatform,
  SOCIAL_VALIDATORS,
  SOCIAL_PLATFORM_CONFIGS,
  getSocialPlatformConfig,
  getAllSocialPlatforms,
  isSupportedPlatform
} from './config';

export type { SocialPlatformConfig } from './config';

// Validation exports
export {
  validateSocialUrl,
  validateSocialLinks,
  areAllSocialLinksValid,
  getSocialLinksErrors,
  isValidUrlForPlatform,
  getErrorMessageForPlatform
} from './validation';

export type { ValidationResult } from './validation';

// Sanitization exports
export {
  sanitizeUrl,
  sanitizeSocialUrl,
  sanitizeSocialLinks,
  extractUsernameFromUrl
} from './sanitizer';

// Type exports
export type {
  SocialLinks,
  SocialLinkInputProps,
  SocialLinksSectionProps,
  SocialLinksValidationError,
  SocialLinksFormState
} from '../../types/social-links';