// Types for user-related operations
// Following Single Responsibility Principle - separate types for different concerns

/**
 * Request payload for changing user password
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Response payload for password change operation
 */
export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Form data for password change UI
 */
export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Validation result for password operations
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Request payload for setting initial password (OAuth users)
 */
export interface SetInitialPasswordRequest {
  newPassword: string;
}

/**
 * User data for password operations
 */
export interface UserPasswordData {
  id: string;
  email: string;
  password: string | null;
}

/**
 * Generic validation result
 */
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
