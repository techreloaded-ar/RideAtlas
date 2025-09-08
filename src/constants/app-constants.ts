/**
 * Costanti globali dell'applicazione
 * Centralizza valori magici e configurazioni comuni
 */

/**
 * Costanti per validazione e limiti
 */
export const VALIDATION_CONSTANTS = {
  BIO_MAX_LENGTH: 200,
  SOCIAL_LINK_TIMEOUT: 300,
  MAP_INITIALIZATION_TIMEOUT: 100,
  MAP_DIMENSION_CHECK_INTERVAL: 50,
  DEBOUNCE_DELAY: 300,
  API_TIMEOUT: 5000,
  RETRY_ATTEMPTS: 3,
} as const;

/**
 * Costanti per UI e colori
 */
export const UI_COLORS = {
  TRACK_DEFAULT: '#3b82f6',
  ROUTE_DEFAULT: '#dc2626',
  SUCCESS: '#10b981',
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
  PRIMARY: '#6366f1',
  SECONDARY: '#64748b',
} as const;

/**
 * Costanti per dimensioni e layout
 */
export const UI_DIMENSIONS = {
  MAP_MIN_HEIGHT: 300,
  MAP_DEFAULT_HEIGHT: 400,
  SIDEBAR_WIDTH: 320,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 80,
  MOBILE_BREAKPOINT: 768,
} as const;

/**
 * Costanti per animazioni e transizioni
 */
export const ANIMATION_CONSTANTS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
  FADE_IN: 200,
  SLIDE_IN: 300,
  BOUNCE: 400,
} as const;

/**
 * Costanti per API e networking
 */
export const API_CONSTANTS = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  TIMEOUT: 10000,
  RETRY_DELAY: 1000,
  MAX_RETRIES: 3,
  RATE_LIMIT_DELAY: 100,
} as const;

/**
 * Costanti per storage e cache
 */
export const STORAGE_CONSTANTS = {
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 ore
  CACHE_DURATION: 5 * 60 * 1000, // 5 minuti
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_GPX_TYPES: ['application/gpx+xml', 'text/xml'],
} as const;

/**
 * Costanti per form e validazione
 */
export const FORM_CONSTANTS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_BIO_LENGTH: 200,
} as const;

/**
 * Costanti per mappe e geolocalizzazione
 */
export const MAP_CONSTANTS = {
  DEFAULT_ZOOM: 13,
  MIN_ZOOM: 1,
  MAX_ZOOM: 18,
  DEFAULT_CENTER: [45.4642, 9.19] as const, // Milano
  TILE_SIZE: 256,
  MAX_BOUNDS_PADDING: 0.1,
  CLUSTER_RADIUS: 50,
} as const;

/**
 * Costanti per social media
 */
export const SOCIAL_CONSTANTS = {
  MAX_SOCIAL_LINKS: 6,
  URL_MAX_LENGTH: 500,
  VALIDATION_TIMEOUT: 300,
  SUPPORTED_PLATFORMS: [
    'instagram',
    'youtube',
    'facebook',
    'tiktok',
    'linkedin',
    'website',
  ] as const,
} as const;

/**
 * Costanti per trip e percorsi
 */
export const TRIP_CONSTANTS = {
  MAX_STAGES: 20,
  MIN_STAGES: 1,
  MAX_WAYPOINTS: 100,
  MAX_TRACK_POINTS: 10000,
  DEFAULT_STAGE_DURATION: 1, // giorni
  MAX_TRIP_DURATION: 30, // giorni
} as const;

/**
 * Costanti per notifiche e messaggi
 */
export const NOTIFICATION_CONSTANTS = {
  SUCCESS_DURATION: 3000,
  ERROR_DURATION: 5000,
  WARNING_DURATION: 4000,
  INFO_DURATION: 3000,
  MAX_NOTIFICATIONS: 5,
} as const;

/**
 * Costanti per paginazione
 */
export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5,
} as const;
