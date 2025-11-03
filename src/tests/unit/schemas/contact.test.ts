import { describe, it, expect } from '@jest/globals';
import { contactFormSchema } from '@/schemas/contact';

describe('schemas/contact', () => {
  describe('contactFormSchema', () => {
    describe('nome field', () => {
      it('should accept valid nome', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Mario Rossi',
          email: 'mario@example.com',
          messaggio: 'Questo è un messaggio di test valido',
        });

        expect(result.success).toBe(true);
      });

      it('should reject nome with less than 2 characters', () => {
        const result = contactFormSchema.safeParse({
          nome: 'M',
          email: 'mario@example.com',
          messaggio: 'Messaggio valido',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Il nome deve contenere almeno 2 caratteri');
        }
      });

      it('should reject nome longer than 100 characters', () => {
        const result = contactFormSchema.safeParse({
          nome: 'a'.repeat(101),
          email: 'mario@example.com',
          messaggio: 'Messaggio valido',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Il nome non può superare 100 caratteri');
        }
      });

      it('should accept nome with exactly 2 characters', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Ab',
          email: 'mario@example.com',
          messaggio: 'Messaggio valido',
        });

        expect(result.success).toBe(true);
      });

      it('should accept nome with exactly 100 characters', () => {
        const result = contactFormSchema.safeParse({
          nome: 'a'.repeat(100),
          email: 'mario@example.com',
          messaggio: 'Messaggio valido',
        });

        expect(result.success).toBe(true);
      });

      it('should trim whitespace from nome', () => {
        const result = contactFormSchema.safeParse({
          nome: '  Mario Rossi  ',
          email: 'mario@example.com',
          messaggio: 'Messaggio valido',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.nome).toBe('Mario Rossi');
        }
      });
    });

    describe('email field', () => {
      it('should accept valid email', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Mario Rossi',
          email: 'mario@example.com',
          messaggio: 'Messaggio valido',
        });

        expect(result.success).toBe(true);
      });

      it('should reject invalid email format', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Mario Rossi',
          email: 'invalid-email',
          messaggio: 'Messaggio valido',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Inserisci un indirizzo email valido');
        }
      });

      it('should reject email without domain', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Mario Rossi',
          email: 'mario@',
          messaggio: 'Messaggio valido',
        });

        expect(result.success).toBe(false);
      });

      it('should trim and lowercase email', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Mario Rossi',
          email: '  MARIO@EXAMPLE.COM  ',
          messaggio: 'Messaggio valido',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe('mario@example.com');
        }
      });

      it('should accept email with subdomain', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Mario Rossi',
          email: 'mario@mail.example.com',
          messaggio: 'Messaggio valido',
        });

        expect(result.success).toBe(true);
      });

      it('should accept email with plus sign', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Mario Rossi',
          email: 'mario+test@example.com',
          messaggio: 'Messaggio valido',
        });

        expect(result.success).toBe(true);
      });
    });

    describe('messaggio field', () => {
      it('should accept valid messaggio', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Mario Rossi',
          email: 'mario@example.com',
          messaggio: 'Questo è un messaggio di test valido',
        });

        expect(result.success).toBe(true);
      });

      it('should reject messaggio with less than 10 characters', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Mario Rossi',
          email: 'mario@example.com',
          messaggio: 'Breve',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Il messaggio deve contenere almeno 10 caratteri');
        }
      });

      it('should reject messaggio longer than 2000 characters', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Mario Rossi',
          email: 'mario@example.com',
          messaggio: 'a'.repeat(2001),
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Il messaggio non può superare 2000 caratteri');
        }
      });

      it('should accept messaggio with exactly 10 characters', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Mario Rossi',
          email: 'mario@example.com',
          messaggio: '1234567890',
        });

        expect(result.success).toBe(true);
      });

      it('should accept messaggio with exactly 2000 characters', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Mario Rossi',
          email: 'mario@example.com',
          messaggio: 'a'.repeat(2000),
        });

        expect(result.success).toBe(true);
      });

      it('should trim whitespace from messaggio', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Mario Rossi',
          email: 'mario@example.com',
          messaggio: '  Messaggio con spazi  ',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.messaggio).toBe('Messaggio con spazi');
        }
      });

      it('should preserve newlines in messaggio', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Mario Rossi',
          email: 'mario@example.com',
          messaggio: 'Riga 1\nRiga 2\nRiga 3',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.messaggio).toContain('\n');
        }
      });
    });

    describe('complete form validation', () => {
      it('should accept completely valid form', () => {
        const result = contactFormSchema.safeParse({
          nome: 'Mario Rossi',
          email: 'mario@example.com',
          messaggio: 'Vorrei avere maggiori informazioni sui vostri itinerari.',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({
            nome: 'Mario Rossi',
            email: 'mario@example.com',
            messaggio: 'Vorrei avere maggiori informazioni sui vostri itinerari.',
          });
        }
      });

      it('should reject form with missing fields', () => {
        const result = contactFormSchema.safeParse({});

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors.length).toBeGreaterThan(0);
        }
      });

      it('should reject form with all invalid fields', () => {
        const result = contactFormSchema.safeParse({
          nome: 'M',
          email: 'invalid',
          messaggio: 'short',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors.length).toBe(3);
        }
      });
    });
  });
});
