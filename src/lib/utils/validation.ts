// src/lib/utils/validation.ts

/**
 * Validate username format
 *
 * Rules:
 * - Length: 2-100 chars
 * - Allowed: a-z, A-Z, 0-9, spaces, hyphens, underscores
 * - Prevent XSS
 */
export function isValidUsername(username: string): boolean {
  return (
    typeof username === 'string' &&
    username.length >= 2 &&
    username.length <= 100 &&
    /^[a-zA-Z0-9\s\-_]+$/.test(username)
  );
}
