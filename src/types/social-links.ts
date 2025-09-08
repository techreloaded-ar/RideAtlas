/**
 * TypeScript interfaces for Social Links functionality
 */

import { SocialPlatform } from '../lib/social-links/config';

/**
 * Social links data structure stored in the database
 */
export interface SocialLinks {
  instagram?: string;
  youtube?: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;
  website?: string;
}

/**
 * Social link input props for form components
 */
export interface SocialLinkInputProps {
  platform: SocialPlatform;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Social links section props
 */
export interface SocialLinksSectionProps {
  initialData: SocialLinks;
  onUpdate: (socialLinks: SocialLinks) => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

/**
 * Social links validation error
 */
export interface SocialLinksValidationError {
  platform: SocialPlatform;
  message: string;
}

/**
 * Social links form state
 */
export interface SocialLinksFormState {
  values: SocialLinks;
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
}