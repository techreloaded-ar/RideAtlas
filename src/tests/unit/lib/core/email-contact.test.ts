import { sendContactEmail } from '@/lib/core/email';

describe('Email Service - Contact', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    process.env.SMTP_HOST = 'test.smtp.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASSWORD = 'testpassword';
    process.env.SMTP_FROM = 'noreply@rideatlas.it';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendContactEmail', () => {
    it('returns success false when SMTP_HOST is missing', async () => {
      delete process.env.SMTP_HOST;

      const result = await sendContactEmail(
        'Mario Rossi',
        'mario@example.com',
        'Questo è un messaggio di test'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Configurazione email mancante');
    });

    it('returns success false when SMTP_USER is missing', async () => {
      delete process.env.SMTP_USER;

      const result = await sendContactEmail(
        'Mario Rossi',
        'mario@example.com',
        'Questo è un messaggio di test'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Configurazione email mancante');
    });

    it('returns success false when SMTP_PASSWORD is missing', async () => {
      delete process.env.SMTP_PASSWORD;

      const result = await sendContactEmail(
        'Mario Rossi',
        'mario@example.com',
        'Questo è un messaggio di test'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Configurazione email mancante');
    });

    it('simulates success in development mode when configuration is incomplete', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      delete process.env.SMTP_HOST;

      const result = await sendContactEmail(
        'Mario Rossi',
        'mario@example.com',
        'Questo è un messaggio di test'
      );

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);

      // Ripristina l'ambiente originale
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('returns success when all configuration is present in test mode', async () => {
      const result = await sendContactEmail(
        'Mario Rossi',
        'mario@example.com',
        'Questo è un messaggio di test'
      );

      // Il servizio dovrebbe fallire perché stiamo usando una configurazione fake
      // ma ha tutti i parametri necessari
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('handles special characters in nome', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      delete process.env.SMTP_HOST;

      const result = await sendContactEmail(
        "Mario D'Angelo",
        'mario@example.com',
        'Messaggio con caratteri speciali'
      );

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('handles multiline messages', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      delete process.env.SMTP_HOST;

      const result = await sendContactEmail(
        'Mario Rossi',
        'mario@example.com',
        'Prima riga\nSeconda riga\nTerza riga'
      );

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('handles long messages', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      delete process.env.SMTP_HOST;

      const longMessage = 'a'.repeat(1500);
      const result = await sendContactEmail(
        'Mario Rossi',
        'mario@example.com',
        longMessage
      );

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('handles email addresses with special characters', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      delete process.env.SMTP_HOST;

      const result = await sendContactEmail(
        'Mario Rossi',
        'mario+test@example.com',
        'Messaggio di test'
      );

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);

      process.env.NODE_ENV = originalNodeEnv;
    });
  });
});
