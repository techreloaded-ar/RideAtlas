/**
 * URL sanitization and validation utilities for social links
 * Implements security measures to prevent XSS and validate URLs
 */

/**
 * Allowed domains for each social platform
 */
const ALLOWED_DOMAINS = {
  instagram: ['instagram.com', 'www.instagram.com'],
  youtube: ['youtube.com', 'www.youtube.com'],
  facebook: ['facebook.com', 'www.facebook.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com'],
  linkedin: ['linkedin.com', 'www.linkedin.com'],
  website: [] // Generic websites - no domain restriction
};

/**
 * URL validation patterns for each social platform
 */
export const URL_PATTERNS = {
  instagram: /^https:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/,
  youtube: /^https:\/\/(www\.)?youtube\.com\/(channel\/|c\/|user\/|@)[a-zA-Z0-9._-]+\/?$/,
  facebook: /^https:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._]+\/?$/,
  tiktok: /^https:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9._]+\/?$/,
  linkedin: /^https:\/\/(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9._-]+\/?$/,
  website: /^https?:\/\/(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/?.*$/
} as const;

/**
 * Sanitizes a URL by removing potentially dangerous characters
 * and ensuring proper encoding
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = url.trim();

  // Remove any null bytes or control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Ensure the URL starts with http:// or https://
  if (sanitized && !sanitized.match(/^https?:\/\//)) {
    sanitized = 'https://' + sanitized;
  }

  // Basic URL encoding for special characters (but preserve valid URL chars)
  try {
    const urlObj = new URL(sanitized);
    return urlObj.toString();
  } catch {
    // If URL is invalid, return empty string
    return '';
  }
}

/**
 * Validates if a URL belongs to allowed domains for a specific platform
 */
export function validateDomain(platform: keyof typeof ALLOWED_DOMAINS, url: string): boolean {
  if (!url) return true; // Empty URLs are allowed

  const allowedDomains = ALLOWED_DOMAINS[platform];
  
  // For generic websites, skip domain validation
  if (platform === 'website' || allowedDomains.length === 0) {
    return true;
  }

  try {
    const urlObj = new URL(url);
    return (allowedDomains as string[]).includes(urlObj.hostname);
  } catch {
    return false;
  }
}

/**
 * Validates URL format for a specific social platform
 */
export function validateUrlFormat(platform: keyof typeof URL_PATTERNS, url: string): boolean {
  if (!url) return true; // Empty URLs are allowed

  const pattern = URL_PATTERNS[platform];
  return pattern.test(url);
}

/**
 * Comprehensive URL validation that combines sanitization, domain and format checks
 */
export function validateAndSanitizeUrl(
  platform: keyof typeof URL_PATTERNS, 
  url: string
): { isValid: boolean; sanitizedUrl: string; error?: string } {
  // First sanitize the URL
  const sanitizedUrl = sanitizeUrl(url);

  // If empty after sanitization, it's valid (optional field)
  if (!sanitizedUrl) {
    return { isValid: true, sanitizedUrl: '' };
  }

  // Validate domain
  if (!validateDomain(platform, sanitizedUrl)) {
    return {
      isValid: false,
      sanitizedUrl,
      error: `URL non valido per ${platform}. Usa un dominio consentito.`
    };
  }

  // Validate format
  if (!validateUrlFormat(platform, sanitizedUrl)) {
    return {
      isValid: false,
      sanitizedUrl,
      error: getValidationMessage(platform)
    };
  }

  return { isValid: true, sanitizedUrl };
}

/**
 * Get validation error message for each platform
 */
function getValidationMessage(platform: keyof typeof URL_PATTERNS): string {
  const messages = {
    instagram: "Inserisci un URL Instagram valido (es: https://instagram.com/username)",
    youtube: "Inserisci un URL YouTube valido (es: https://youtube.com/@username)",
    facebook: "Inserisci un URL Facebook valido (es: https://facebook.com/username)",
    tiktok: "Inserisci un URL TikTok valido (es: https://tiktok.com/@username)",
    linkedin: "Inserisci un URL LinkedIn valido (es: https://linkedin.com/in/username)",
    website: "Inserisci un URL valido (es: https://example.com)"
  };

  return messages[platform];
}