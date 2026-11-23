import { z } from 'zod';

export const COMMUNITY_TEXT_MAX_LENGTH = 1000;
export const COMMENTS_PAGE_SIZE = 20;

// Recensione: voto 1–5 obbligatorio, testo facoltativo
export const tripReviewSchema = z.object({
  rating: z.number({ required_error: 'Seleziona un voto da 1 a 5 stelle', invalid_type_error: 'Seleziona un voto da 1 a 5 stelle' })
    .int('Il voto deve essere un numero intero')
    .min(1, 'Il voto minimo è 1 stella')
    .max(5, 'Il voto massimo è 5 stelle'),
  content: z.string()
    .trim()
    .max(COMMUNITY_TEXT_MAX_LENGTH, `La recensione non può superare ${COMMUNITY_TEXT_MAX_LENGTH} caratteri`)
    .optional()
    .nullable()
    .transform(value => (value ? value : null)),
});

// Commento: testo obbligatorio
export const tripCommentSchema = z.object({
  content: z.string({ required_error: 'Scrivi il testo del commento', invalid_type_error: 'Scrivi il testo del commento' })
    .trim()
    .min(1, 'Scrivi il testo del commento')
    .max(COMMUNITY_TEXT_MAX_LENGTH, `Il commento non può superare ${COMMUNITY_TEXT_MAX_LENGTH} caratteri`),
});

export type TripReviewInput = { rating: number; content?: string | null };
export type TripCommentInput = z.infer<typeof tripCommentSchema>;
