/**
 * Rate Limiting Module
 *
 * Provides in-memory rate limiting functionality for API endpoints.
 * Future improvement: migrate to Redis for distributed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: Date;
}

/**
 * In-memory storage for rate limit tracking
 * Key: user identifier (e.g., userId)
 * Value: rate limit entry with count and reset time
 */
export const rateLimitTracker = new Map<string, RateLimitEntry>();

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Check if a user has exceeded their rate limit
 *
 * @param identifier - Unique identifier for the user (e.g., userId)
 * @param config - Rate limit configuration
 * @returns Object indicating if limit is exceeded and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt?: Date } {
  const entry = rateLimitTracker.get(identifier);
  const now = new Date();

  // No previous entry or window expired - allow and create new entry
  if (!entry || entry.resetAt <= now) {
    rateLimitTracker.set(identifier, {
      count: 1,
      resetAt: new Date(Date.now() + config.windowMs),
    });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  // Within window - check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt
    };
  }

  // Within window and under limit - increment and allow
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt
  };
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or manual reset scenarios
 *
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitTracker.delete(identifier);
}

/**
 * Clear all rate limit entries
 * Useful for testing or system maintenance
 */
export function clearAllRateLimits(): void {
  rateLimitTracker.clear();
}

/**
 * Get current rate limit status for an identifier
 *
 * @param identifier - Unique identifier to check
 * @returns Current count and reset time, or null if no entry exists
 */
export function getRateLimitStatus(identifier: string): RateLimitEntry | null {
  return rateLimitTracker.get(identifier) || null;
}
