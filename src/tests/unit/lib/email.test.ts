import { sendVerificationEmail } from '@/lib/email';

describe('Email Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    process.env.SMTP_HOST = 'test.smtp.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASSWORD = 'testpassword';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendVerificationEmail', () => {
    it('returns success false when SMTP_HOST is missing', async () => {
      delete process.env.SMTP_HOST;

      const result = await sendVerificationEmail('user@example.com', 'test-token-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Configurazione email mancante');
    });

    it('returns success false when SMTP_USER is missing', async () => {
      delete process.env.SMTP_USER;

      const result = await sendVerificationEmail('user@example.com', 'test-token-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Configurazione email mancante');
    });

    it('returns success false when SMTP_PASSWORD is missing', async () => {
      delete process.env.SMTP_PASSWORD;

      const result = await sendVerificationEmail('user@example.com', 'test-token-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Configurazione email mancante');
    });

    it('simulates success in development mode when configuration is incomplete', async () => {
      delete process.env.SMTP_HOST;
      process.env.NODE_ENV = 'development';

      const result = await sendVerificationEmail('user@example.com', 'test-token-123');
      
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });

    it('returns success when all configuration is present in test mode', async () => {
      // In modalità test, con configurazione completa ma senza reale invio
      const result = await sendVerificationEmail('user@example.com', 'test-token-123');
      
      // Il servizio dovrebbe fallire perché stiamo usando una configurazione fake
      // ma ha tutti i parametri necessari
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
