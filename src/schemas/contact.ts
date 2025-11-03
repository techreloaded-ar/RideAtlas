import { z } from 'zod';

// Schema per la validazione del form di contatto
export const contactFormSchema = z.object({
  nome: z.string()
    .min(2, 'Il nome deve contenere almeno 2 caratteri')
    .max(100, 'Il nome non può superare 100 caratteri')
    .trim(),

  email: z.string()
    .trim()
    .toLowerCase()
    .email('Inserisci un indirizzo email valido'),

  messaggio: z.string()
    .min(10, 'Il messaggio deve contenere almeno 10 caratteri')
    .max(2000, 'Il messaggio non può superare 2000 caratteri')
    .trim()
});

// Type per il form
export type ContactFormData = z.infer<typeof contactFormSchema>;
