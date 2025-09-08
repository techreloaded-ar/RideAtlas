/**
 * URL sanitization utilities for social links
 * Provides functions to clean and normalize social media URLs
 */

import { SocialPlatform } from './config';

/**
 * Sanitize a URL by removing dangerous characters and normalizing format
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = url.trim();

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>'"]/g, '');

  // Normalize protocol
  if (sanitized && !sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
    sanitized = 'https://' + sanitized;
  }

  // Remove trailing slashes (except for root domains)
  if (sanitized.endsWith('/') && sanitized.split('/').length > 3) {
    sanitized = sanitized.slice(0, -1);
  }

  return sanitized;
}

/**
 * Sanitize a social URL for a specific platform
 */
export function sanitizeSocialUrl(platform: SocialPlatform, url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  let sanitized = sanitizeUrl(url);
  
  // Platform-specific sanitization
  switch (platform) {
    case SocialPlatform.INSTAGRAM:
      sanitized = sanitizeInstagramUrl(sanitized);
      break;
    case SocialPlatform.YOUTUBE:
      sanitized = sanitizeYouTubeUrl(sanitized);
      break;
    case SocialPlatform.FACEBOOK:
      sanitized = sanitizeFacebookUrl(sanitized);
      break;
    case SocialPlatform.TIKTOK:
      sanitized = sanitizeTikTokUrl(sanitized);
      break;
    case SocialPlatform.LINKEDIN:
      sanitized = sanitizeLinkedInUrl(sanitized);
      break;
    case SocialPlatform.WEBSITE:
      // Generic website sanitization already applied
      break;
  }

  return sanitized;
}

/**
 * Sanitize Instagram URL
 */
function sanitizeInstagramUrl(url: string): string {
  if (!url) return '';

  // Normalize Instagram domain
  url = url.replace(/^https?:\/\/(www\.)?instagram\.com/, 'https://instagram.com');
  
  // Remove query parameters and fragments
  url = url.split('?')[0].split('#')[0];
  
  // Remove trailing slash for non-root paths
  if (url.endsWith('/') && url.split('/').length > 3) {
    url = url.slice(0, -1);
  }
  
  return url;
}

/**
 * Sanitize YouTube URL
 */
function sanitizeYouTubeUrl(url: string): string {
  if (!url) return '';

  // Normalize YouTube domain
  url = url.replace(/^https?:\/\/(www\.)?youtube\.com/, 'https://youtube.com');
  
  // Remove query parameters and fragments
  url = url.split('?')[0].split('#')[0];
  
  // Remove trailing slash for non-root paths
  if (url.endsWith('/') && url.split('/').length > 3) {
    url = url.slice(0, -1);
  }
  
  return url;
}

/**
 * Sanitize Facebook URL
 */
function sanitizeFacebookUrl(url: string): string {
  if (!url) return '';

  // Normalize Facebook domain
  url = url.replace(/^https?:\/\/(www\.)?facebook\.com/, 'https://facebook.com');
  
  // Remove query parameters and fragments
  url = url.split('?')[0].split('#')[0];
  
  // Remove trailing slash for non-root paths
  if (url.endsWith('/') && url.split('/').length > 3) {
    url = url.slice(0, -1);
  }
  
  return url;
}

/**
 * Sanitize TikTok URL
 */
function sanitizeTikTokUrl(url: string): string {
  if (!url) return '';

  // Normalize TikTok domain
  url = url.replace(/^https?:\/\/(www\.)?tiktok\.com/, 'https://tiktok.com');
  
  // Remove query parameters and fragments
  url = url.split('?')[0].split('#')[0];
  
  // Remove trailing slash for non-root paths
  if (url.endsWith('/') && url.split('/').length > 3) {
    url = url.slice(0, -1);
  }
  
  return url;
}

/**
 * Sanitize LinkedIn URL
 */
function sanitizeLinkedInUrl(url: string): string {
  if (!url) return '';

  // Normalize LinkedIn domain
  url = url.replace(/^https?:\/\/(www\.)?linkedin\.com/, 'https://linkedin.com');
  
  // Remove query parameters and fragments
  url = url.split('?')[0].split('#')[0];
  
  // Remove trailing slash for non-root paths
  if (url.endsWith('/') && url.split('/').length > 3) {
    url = url.slice(0, -1);
  }
  
  return url;
}

/**
 * Sanitize multiple social URLs
 */
export function sanitizeSocialLinks(socialLinks: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [platform, url] of Object.entries(socialLinks)) {
    if (Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
      sanitized[platform] = sanitizeSocialUrl(platform as SocialPlatform, url);
    } else {
      // For unknown platforms, apply generic sanitization
      sanitized[platform] = sanitizeUrl(url);
    }
  }

  return sanitized;
}

/**
 * Extract username from a social URL
 */
export function extractUsernameFromUrl(platform: SocialPlatform, url: string): string | null {
  if (!url) return null;

  const sanitized = sanitizeSocialUrl(platform, url);
  
  try {
    const urlObj = new URL(sanitized);
    const pathname = urlObj.pathname;

    switch (platform) {
      case SocialPlatform.INSTAGRAM:
      case SocialPlatform.FACEBOOK:
        // Extract username from /username format
        const match = pathname.match(/^\/([^\/]+)\/?$/);
        return match ? match[1] : null;

      case SocialPlatform.YOUTUBE:
        // Extract from /@username, /c/username, /channel/username, /user/username
        const ytMatch = pathname.match(/^\/([@]|c\/|channel\/|user\/)([^\/]+)\/?$/);
        return ytMatch ? ytMatch[2] : null;

      case SocialPlatform.TIKTOK:
        // Extract from /@username format
        const ttMatch = pathname.match(/^\/@([^\/]+)\/?$/);
        return ttMatch ? ttMatch[1] : null;

      case SocialPlatform.LINKEDIN:
        // Extract from /in/username or /company/companyname format
        const liMatch = pathname.match(/^\/(in|company)\/([^\/]+)\/?$/);
        return liMatch ? liMatch[2] : null;

      case SocialPlatform.WEBSITE:
        // For websites, return the domain
        return urlObj.hostname;

      default:
        return null;
    }
  } catch {
    return null;
  }
}