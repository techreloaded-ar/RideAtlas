/**
 * Social platform configuration and validation utilities
 * Provides centralized configuration for supported social networks
 */

import { LucideIcon, MessageCircle, Globe, Video, Users, Hash } from 'lucide-react';

/**
 * Supported social media platforms
 */
export enum SocialPlatform {
  INSTAGRAM = 'instagram',
  YOUTUBE = 'youtube',
  FACEBOOK = 'facebook',
  TIKTOK = 'tiktok',
  LINKEDIN = 'linkedin',
  WEBSITE = 'website'
}

/**
 * Configuration for a social media platform
 */
export interface SocialPlatformConfig {
  platform: SocialPlatform;
  label: string;
  placeholder: string;
  icon: LucideIcon;
  validator: (url: string) => boolean;
  urlPattern: RegExp;
  baseUrl: string;
  errorMessage: string;
}

/**
 * URL validation patterns for each social network
 */
export const SOCIAL_VALIDATORS = {
  [SocialPlatform.INSTAGRAM]: {
    pattern: /^https:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/,
    message: "Inserisci un URL Instagram valido (es: https://instagram.com/username)"
  },
  [SocialPlatform.YOUTUBE]: {
    pattern: /^https:\/\/(www\.)?youtube\.com\/(channel\/|c\/|user\/|@)[a-zA-Z0-9._-]+\/?$/,
    message: "Inserisci un URL YouTube valido (es: https://youtube.com/@username)"
  },
  [SocialPlatform.FACEBOOK]: {
    pattern: /^https:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._]+\/?$/,
    message: "Inserisci un URL Facebook valido (es: https://facebook.com/username)"
  },
  [SocialPlatform.TIKTOK]: {
    pattern: /^https:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9._]+\/?$/,
    message: "Inserisci un URL TikTok valido (es: https://tiktok.com/@username)"
  },
  [SocialPlatform.LINKEDIN]: {
    pattern: /^https:\/\/(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9._-]+\/?$/,
    message: "Inserisci un URL LinkedIn valido (es: https://linkedin.com/in/username)"
  },
  [SocialPlatform.WEBSITE]: {
    pattern: /^https?:\/\/(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/?.*$/,
    message: "Inserisci un URL valido (es: https://example.com)"
  }
} as const;

/**
 * Complete configuration for all supported social platforms
 */
export const SOCIAL_PLATFORM_CONFIGS: Record<SocialPlatform, SocialPlatformConfig> = {
  [SocialPlatform.INSTAGRAM]: {
    platform: SocialPlatform.INSTAGRAM,
    label: 'Instagram',
    placeholder: 'https://instagram.com/username',
    icon: MessageCircle, // Using MessageCircle as Instagram icon replacement
    validator: (url: string) => SOCIAL_VALIDATORS.instagram.pattern.test(url),
    urlPattern: SOCIAL_VALIDATORS.instagram.pattern,
    baseUrl: 'https://instagram.com/',
    errorMessage: SOCIAL_VALIDATORS.instagram.message
  },
  [SocialPlatform.YOUTUBE]: {
    platform: SocialPlatform.YOUTUBE,
    label: 'YouTube',
    placeholder: 'https://youtube.com/@username',
    icon: Video, // Using Video as YouTube icon replacement
    validator: (url: string) => SOCIAL_VALIDATORS.youtube.pattern.test(url),
    urlPattern: SOCIAL_VALIDATORS.youtube.pattern,
    baseUrl: 'https://youtube.com/',
    errorMessage: SOCIAL_VALIDATORS.youtube.message
  },
  [SocialPlatform.FACEBOOK]: {
    platform: SocialPlatform.FACEBOOK,
    label: 'Facebook',
    placeholder: 'https://facebook.com/username',
    icon: MessageCircle, // Using MessageCircle as Facebook icon replacement
    validator: (url: string) => SOCIAL_VALIDATORS.facebook.pattern.test(url),
    urlPattern: SOCIAL_VALIDATORS.facebook.pattern,
    baseUrl: 'https://facebook.com/',
    errorMessage: SOCIAL_VALIDATORS.facebook.message
  },
  [SocialPlatform.TIKTOK]: {
    platform: SocialPlatform.TIKTOK,
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@username',
    icon: Hash, // Using Hash as TikTok icon replacement
    validator: (url: string) => SOCIAL_VALIDATORS.tiktok.pattern.test(url),
    urlPattern: SOCIAL_VALIDATORS.tiktok.pattern,
    baseUrl: 'https://tiktok.com/',
    errorMessage: SOCIAL_VALIDATORS.tiktok.message
  },
  [SocialPlatform.LINKEDIN]: {
    platform: SocialPlatform.LINKEDIN,
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/in/username',
    icon: Users, // Using Users as LinkedIn icon replacement
    validator: (url: string) => SOCIAL_VALIDATORS.linkedin.pattern.test(url),
    urlPattern: SOCIAL_VALIDATORS.linkedin.pattern,
    baseUrl: 'https://linkedin.com/',
    errorMessage: SOCIAL_VALIDATORS.linkedin.message
  },
  [SocialPlatform.WEBSITE]: {
    platform: SocialPlatform.WEBSITE,
    label: 'Sito Web',
    placeholder: 'https://example.com',
    icon: Globe,
    validator: (url: string) => SOCIAL_VALIDATORS.website.pattern.test(url),
    urlPattern: SOCIAL_VALIDATORS.website.pattern,
    baseUrl: 'https://',
    errorMessage: SOCIAL_VALIDATORS.website.message
  }
};

/**
 * Get configuration for a specific social platform
 */
export function getSocialPlatformConfig(platform: SocialPlatform): SocialPlatformConfig {
  return SOCIAL_PLATFORM_CONFIGS[platform];
}

/**
 * Get all supported social platforms
 */
export function getAllSocialPlatforms(): SocialPlatform[] {
  return Object.values(SocialPlatform);
}

/**
 * Check if a platform is supported
 */
export function isSupportedPlatform(platform: string): platform is SocialPlatform {
  return Object.values(SocialPlatform).includes(platform as SocialPlatform);
}

/**
 * Get platform configuration by platform key
 */
export function getPlatformConfig(platform: SocialPlatform): SocialPlatformConfig {
  return SOCIAL_PLATFORM_CONFIGS[platform];
}

/**
 * Display order for social platforms in UI
 */
export const PLATFORM_DISPLAY_ORDER: SocialPlatform[] = [
  SocialPlatform.INSTAGRAM,
  SocialPlatform.YOUTUBE,
  SocialPlatform.FACEBOOK,
  SocialPlatform.TIKTOK,
  SocialPlatform.LINKEDIN,
  SocialPlatform.WEBSITE
];