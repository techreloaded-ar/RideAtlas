import { z } from 'zod';

// Profile update schema
export const updateProfileSchema = z.object({
  name: z.string()
    .min(1, 'Il nome è obbligatorio')
    .max(100, 'Nome troppo lungo'),
  bio: z.string()
    .max(1000, 'La biografia deve essere massimo 1000 caratteri')
    .optional(),
  bikeDescription: z.string()
    .max(500, 'La descrizione moto deve essere massimo 500 caratteri')
    .optional(),
});

// Email change schema
export const changeEmailSchema = z.object({
  newEmail: z.string()
    .email('Inserisci un indirizzo email valido')
    .min(5, 'Email troppo corta')
    .max(100, 'Email troppo lunga'),
  password: z.string()
    .min(1, 'Password richiesta per conferma'),
});

// Media item schema
export const mediaItemSchema = z.object({
  id: z.string(),
  type: z.literal('image'),
  url: z.string().url('URL non valido'),
  caption: z.string().max(200, 'Didascalia troppo lunga').optional(),
  uploadedAt: z.string().optional(),
});

// TypeScript types inferred from schemas
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type MediaItemValidated = z.infer<typeof mediaItemSchema>;
