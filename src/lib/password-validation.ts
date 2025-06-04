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

export const passwordSchema = z.string().superRefine((password, ctx) => {
  const errors = validatePasswordComplexity(password);
  
  if (errors.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: errors.join('. ')
    });
  }
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
