/**
 * Error handling utilities for social links functionality
 * Provides structured error types and handling
 */

import { SocialPlatform } from '@/types/user';

/**
 * Error codes for social links operations
 */
export enum SocialLinksErrorCode {
  INVALID_URL = 'INVALID_URL',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  SAVE_FAILED = 'SAVE_FAILED',
  SANITIZATION_FAILED = 'SANITIZATION_FAILED',
  DOMAIN_NOT_ALLOWED = 'DOMAIN_NOT_ALLOWED'
}

/**
 * Structured error for social links operations
 */
export interface SocialLinksError {
  field: SocialPlatform;
  message: string;
  code: SocialLinksErrorCode;
}

/**
 * Collection of social links errors
 */
export interface SocialLinksErrors {
  [key: string]: SocialLinksError;
}

/**
 * Result type for social links validation
 */
export interface SocialLinksValidationResult {
  isValid: boolean;
  errors: SocialLinksErrors;
  sanitizedData?: Record<string, string>;
}

/**
 * Predefined error messages for better UX
 */
export const ERROR_MESSAGES = {
  [SocialLinksErrorCode.INVALID_URL]: "URL non valido per questo social network",
  [SocialLinksErrorCode.NETWORK_ERROR]: "Errore di connessione. Riprova più tardi",
  [SocialLinksErrorCode.VALIDATION_FAILED]: "Alcuni link non sono validi. Controlla e riprova",
  [SocialLinksErrorCode.SAVE_FAILED]: "Impossibile salvare i link social. Riprova più tardi",
  [SocialLinksErrorCode.SANITIZATION_FAILED]: "Impossibile processare l'URL fornito",
  [SocialLinksErrorCode.DOMAIN_NOT_ALLOWED]: "Dominio non consentito per questo social network"
} as const;

/**
 * Creates a structured error for a specific social platform
 */
export function createSocialLinksError(
  field: SocialPlatform,
  code: SocialLinksErrorCode,
  customMessage?: string
): SocialLinksError {
  return {
    field,
    code,
    message: customMessage || ERROR_MESSAGES[code]
  };
}

/**
 * Checks if there are any validation errors
 */
export function hasValidationErrors(errors: SocialLinksErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Gets the first error message for display purposes
 */
export function getFirstErrorMessage(errors: SocialLinksErrors): string | null {
  const firstError = Object.values(errors)[0];
  return firstError ? firstError.message : null;
}

/**
 * Converts validation errors to a format suitable for form display
 */
export function formatErrorsForForm(errors: SocialLinksErrors): Record<string, string> {
  const formErrors: Record<string, string> = {};
  
  Object.entries(errors).forEach(([field, error]) => {
    formErrors[field] = error.message;
  });
  
  return formErrors;
}

/**
 * Creates a network error for API failures
 */
export function createNetworkError(): SocialLinksError {
  return createSocialLinksError(
    SocialPlatform.WEBSITE, // Generic platform for network errors
    SocialLinksErrorCode.NETWORK_ERROR
  );
}

/**
 * Creates a save failed error
 */
export function createSaveFailedError(): SocialLinksError {
  return createSocialLinksError(
    SocialPlatform.WEBSITE, // Generic platform for save errors
    SocialLinksErrorCode.SAVE_FAILED
  );
}