import { z } from 'zod';

export const validatePasswordComplexity = (password: string): string[] => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('La password deve contenere almeno 8 caratteri');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera maiuscola');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera minuscola');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('La password deve contenere almeno un numero');
  }
  
  return errors;
};

/**
 * Validates that the new password is different from the current one
 * @param newPassword - New password to validate
 * @param currentPassword - Current password to compare against
 * @returns string[] - Array of validation errors (empty if valid)
 */
export const validatePasswordChange = (newPassword: string, currentPassword: string): string[] => {
  const complexityErrors = validatePasswordComplexity(newPassword);
  
  if (newPassword === currentPassword) {
    complexityErrors.push('La nuova password deve essere diversa da quella attuale');
  }
  
  return complexityErrors;
};

export const passwordSchema = z.string().superRefine((password, ctx) => {
  const errors = validatePasswordComplexity(password);
  
  if (errors.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: errors.join('. ')
    });
  }
});

/**
 * Zod schema for password change validation
 * Includes both current and new password validation
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password attuale richiesta'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Conferma password richiesta'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Le password non coincidono',
  path: ['confirmPassword'],
}).refine((data) => data.newPassword !== data.currentPassword, {
  message: 'La nuova password deve essere diversa da quella attuale',
  path: ['newPassword'],
});

export const isPasswordValid = (password: string): boolean => {
  return validatePasswordComplexity(password).length === 0;
};

export const getPasswordRequirements = (): string[] => {
  return [
    'Almeno 8 caratteri',
    'Almeno una lettera maiuscola',
    'Almeno una lettera minuscola',
    'Almeno un numero'
  ];
};
