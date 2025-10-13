/**
 * Type Definitions: Ranger Profile Feature
 *
 * Definisce tutti i tipi TypeScript utilizzati dalla feature.
 * Questi tipi rappresentano il contratto tra database, server actions, e componenti UI.
 */

/**
 * RangerProfile
 *
 * Rappresenta il profilo pubblico di un Ranger.
 * Questo tipo è derivato dal modello Prisma User, ma include SOLO i campi pubblici.
 *
 * PRIVACY: Il campo `email` è ESPLICITAMENTE ESCLUSO (FR-008).
 */
export interface RangerProfile {
  /** Unique identifier (Prisma CUID) */
  id: string;

  /** Full name of the Ranger (used for display and URL generation) */
  name: string;

  /** Profile image URL (nullable - show generated avatar if null) */
  image: string | null;

  /** Biography text (nullable - show placeholder if null per FR-013) */
  bio: string | null;

  /**
   * Social media links as key-value pairs.
   * Key: platform name (es. "instagram", "facebook")
   * Value: full URL to profile
   *
   * Nullable - hide social section if null.
   * Structure is flexible to support any social platform.
   */
  socialLinks: SocialLinks | null;

  /**
   * Whether the account is active.
   * Future use for FR-016 (disabled accounts).
   * For MVP, always true.
   */
  isActive: boolean;

  /**
   * Motorcycle description (nullable - optional for Rangers).
   * Max 500 characters.
   */
  bikeDescription: string | null;

  /**
   * Array of motorcycle photos.
   * Each photo is a MediaItem with url, type, etc.
   */
  bikePhotos: Array<{ url: string; type: string; caption?: string }>;
}

/**
 * SocialLinks
 *
 * Flexible structure for social media links.
 * Allows any platform name as key with URL string as value.
 *
 * Common platforms: instagram, facebook, youtube, twitter, tiktok, linkedin
 */
export interface SocialLinks {
  [platform: string]: string;
}

/**
 * Type guard for SocialLinks validation.
 */
export function isSocialLinks(value: unknown): value is SocialLinks {
  if (!value || typeof value !== 'object') return false;
  // All values must be strings (URLs)
  return Object.values(value).every(v => typeof v === 'string');
}

/**
 * RangerTripSummary
 *
 * Rappresenta un viaggio nella lista del profilo Ranger.
 * Contiene solo le informazioni necessarie per la visualizzazione card.
 */
export interface RangerTripSummary {
  /** Unique identifier (Prisma CUID) */
  id: string;

  /** Trip title for display */
  title: string;

  /** URL slug for navigation to trip detail page */
  slug: string;

  /**
   * Thumbnail image URL extracted from trip media array.
   * Nullable - show placeholder image if null.
   */
  thumbnailUrl: string | null;

  /**
   * Trip duration in days (from Trip.duration_days).
   * Used for display: "X giorni" o "1 giorno"
   */
  durationDays: number;

  /**
   * Total distance in kilometers.
   * MVP: Always null (distance calculation out of scope).
   * Future: Calculated from GPX file.
   * Display: Show "N/A" or hide when null.
   */
  distanceKm: number | null;
}

/**
 * Helper: Extract thumbnail from Trip media array
 */
export function extractThumbnail(media: unknown): string | null {
  if (!Array.isArray(media) || media.length === 0) return null;
  const first = media[0];
  if (typeof first === 'object' && first !== null && 'url' in first) {
    return (first as { url: string }).url;
  }
  return null;
}

/**
 * RangerProfileData
 *
 * Aggregato completo restituito da getRangerProfile server action.
 * Combina profilo Ranger + lista viaggi + metadati.
 */
export interface RangerProfileData {
  /** Ranger's public profile information */
  ranger: RangerProfile;

  /**
   * List of published trips (max 20 per FR-011).
   * Ordered by created_at DESC.
   * Empty array if no published trips (handled by FR-015).
   */
  trips: RangerTripSummary[];

  /**
   * Total count of published trips for this Ranger.
   * May be > trips.length if Ranger has more than 20 trips.
   * Future use: Show "Altri X viaggi" or pagination.
   */
  totalTripsCount: number;
}

/**
 * RangerProfileError
 *
 * Discriminated union of possible errors from getRangerProfile.
 */
export type RangerProfileError =
  | NotFoundError
  | InvalidRoleError
  | InactiveAccountError;

/**
 * NOT_FOUND Error
 *
 * Returned when username does not match any user in database.
 * HTTP equivalent: 404 Not Found
 */
export interface NotFoundError {
  type: 'NOT_FOUND';
  message: 'Ranger non trovato';
}

/**
 * INVALID_ROLE Error
 *
 * Returned when user exists but role is not Ranger/Sentinel.
 * Business rule: Only Rangers and Sentinels can have public profiles.
 */
export interface InvalidRoleError {
  type: 'INVALID_ROLE';
  message: 'Utente non è un Ranger';
}

/**
 * INACTIVE Error
 *
 * Returned when Ranger account is disabled (isActive = false).
 * NOTE: MVP implementation may return NOT_FOUND instead until isActive field exists.
 */
export interface InactiveAccountError {
  type: 'INACTIVE';
  message: 'Account non attivo';
}

/**
 * RangerProfileResult
 *
 * Result type for getRangerProfile server action.
 * Uses discriminated union pattern for type-safe error handling.
 */
export type RangerProfileResult =
  | { success: true; data: RangerProfileData }
  | { success: false; error: RangerProfileError };

/**
 * Type guards for narrowing error types
 */

export function isNotFoundError(
  error: RangerProfileError
): error is NotFoundError {
  return error.type === 'NOT_FOUND';
}

export function isInvalidRoleError(
  error: RangerProfileError
): error is InvalidRoleError {
  return error.type === 'INVALID_ROLE';
}

export function isInactiveAccountError(
  error: RangerProfileError
): error is InactiveAccountError {
  return error.type === 'INACTIVE';
}

/**
 * Validation utilities
 */

/**
 * Validate that RangerProfile has all required fields and correct types.
 */
export function isValidRangerProfile(profile: unknown): profile is RangerProfile {
  if (!profile || typeof profile !== 'object') return false;
  const p = profile as Partial<RangerProfile>;

  return (
    typeof p.id === 'string' && p.id.length > 0 &&
    typeof p.name === 'string' && p.name.length > 0 &&
    (p.image === null || (typeof p.image === 'string' && p.image.length > 0)) &&
    (p.bio === null || typeof p.bio === 'string') &&
    (p.socialLinks === null || isSocialLinks(p.socialLinks)) &&
    typeof p.isActive === 'boolean'
  );
}

/**
 * Validate that RangerTripSummary has all required fields and correct types.
 */
export function isValidRangerTripSummary(trip: unknown): trip is RangerTripSummary {
  if (!trip || typeof trip !== 'object') return false;
  const t = trip as Partial<RangerTripSummary>;

  return (
    typeof t.id === 'string' && t.id.length > 0 &&
    typeof t.title === 'string' && t.title.length > 0 &&
    typeof t.slug === 'string' && t.slug.length > 0 &&
    (t.thumbnailUrl === null || typeof t.thumbnailUrl === 'string') &&
    typeof t.durationDays === 'number' && t.durationDays > 0 &&
    (t.distanceKm === null || typeof t.distanceKm === 'number')
  );
}

/**
 * Runtime assertion: Verify email is never included in profile
 *
 * CRITICAL for FR-008 compliance.
 * Throws error if email field detected.
 */
export function assertNoEmailInProfile(profile: unknown): void {
  if (!profile || typeof profile !== 'object') return;
  const p = profile as Record<string, unknown>;

  if ('email' in p) {
    throw new Error(
      'PRIVACY VIOLATION: Email field must never be included in RangerProfile (FR-008)'
    );
  }
}

/**
 * Test fixtures for type examples
 */
export const FIXTURE_RANGER_PROFILE: RangerProfile = {
  id: 'clFixture1',
  name: 'John Doe',
  image: 'https://example.com/avatar.jpg',
  bio: 'Passionate motorcycle rider exploring Europe for 10+ years.',
  socialLinks: {
    instagram: 'https://instagram.com/johndoe',
    youtube: 'https://youtube.com/@johndoe',
  },
  isActive: true,
  bikeDescription: 'BMW R1250GS Adventure - Black Edition',
  bikePhotos: [],
};

export const FIXTURE_RANGER_TRIP: RangerTripSummary = {
  id: 'clTrip1',
  title: 'Dolomiti Mountain Adventure',
  slug: 'dolomiti-mountain-adventure',
  thumbnailUrl: 'https://example.com/trip-thumb.jpg',
  durationDays: 7,
  distanceKm: null,
};

export const FIXTURE_RANGER_PROFILE_DATA: RangerProfileData = {
  ranger: FIXTURE_RANGER_PROFILE,
  trips: [FIXTURE_RANGER_TRIP],
  totalTripsCount: 1,
};
