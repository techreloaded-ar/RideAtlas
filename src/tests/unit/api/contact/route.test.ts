import { POST } from '@/app/api/contact/route';
import { NextRequest } from 'next/server';
import { sendContactEmail } from '@/lib/core/email';

// Mock delle dipendenze
jest.mock('@/lib/core/email', () => ({
  sendContactEmail: jest.fn(),
}));

const mockSendContactEmail = sendContactEmail as jest.MockedFunction<typeof sendContactEmail>;

describe('/api/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    const validContactData = {
      nome: 'Mario Rossi',
      email: 'mario@example.com',
      messaggio: 'Vorrei avere maggiori informazioni sui vostri itinerari.',
    };

    it('should successfully send contact email with valid data', async () => {
      mockSendContactEmail.mockResolvedValue({ success: true });

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(validContactData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Messaggio inviato con successo!');
      expect(mockSendContactEmail).toHaveBeenCalledWith(
        'Mario Rossi',
        'mario@example.com',
        'Vorrei avere maggiori informazioni sui vostri itinerari.'
      );
    });

    it('should return simulated flag when email is simulated', async () => {
      mockSendContactEmail.mockResolvedValue({ success: true, simulated: true });

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(validContactData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.simulated).toBe(true);
    });

    it('should reject request with missing nome field', async () => {
      const invalidData = {
        email: 'mario@example.com',
        messaggio: 'Messaggio valido',
      };

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Dati non validi');
      expect(data.details).toBeDefined();
      expect(mockSendContactEmail).not.toHaveBeenCalled();
    });

    it('should reject request with invalid email', async () => {
      const invalidData = {
        nome: 'Mario Rossi',
        email: 'invalid-email',
        messaggio: 'Messaggio valido',
      };

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Dati non validi');
      expect(data.details?.email).toBeDefined();
      expect(mockSendContactEmail).not.toHaveBeenCalled();
    });

    it('should reject request with messaggio too short', async () => {
      const invalidData = {
        nome: 'Mario Rossi',
        email: 'mario@example.com',
        messaggio: 'Corto',
      };

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Dati non validi');
      expect(data.details?.messaggio).toBeDefined();
      expect(mockSendContactEmail).not.toHaveBeenCalled();
    });

    it('should reject request with nome too short', async () => {
      const invalidData = {
        nome: 'M',
        email: 'mario@example.com',
        messaggio: 'Messaggio valido di almeno 10 caratteri',
      };

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Dati non validi');
      expect(data.details?.nome).toBeDefined();
      expect(mockSendContactEmail).not.toHaveBeenCalled();
    });

    it('should reject request with all invalid fields', async () => {
      const invalidData = {
        nome: 'M',
        email: 'invalid',
        messaggio: 'short',
      };

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.details?.nome).toBeDefined();
      expect(data.details?.email).toBeDefined();
      expect(data.details?.messaggio).toBeDefined();
      expect(mockSendContactEmail).not.toHaveBeenCalled();
    });

    it('should return 500 when email service fails', async () => {
      mockSendContactEmail.mockResolvedValue({
        success: false,
        error: 'SMTP connection failed',
      });

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(validContactData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Si è verificato un errore');
      expect(mockSendContactEmail).toHaveBeenCalled();
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Errore del server. Riprova più tardi.');
      expect(mockSendContactEmail).not.toHaveBeenCalled();
    });

    it('should trim whitespace from all fields', async () => {
      mockSendContactEmail.mockResolvedValue({ success: true });

      const dataWithWhitespace = {
        nome: '  Mario Rossi  ',
        email: '  mario@example.com  ',
        messaggio: '  Messaggio con spazi  ',
      };

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(dataWithWhitespace),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendContactEmail).toHaveBeenCalledWith(
        'Mario Rossi',
        'mario@example.com',
        'Messaggio con spazi'
      );
    });

    it('should lowercase email address', async () => {
      mockSendContactEmail.mockResolvedValue({ success: true });

      const dataWithUppercaseEmail = {
        nome: 'Mario Rossi',
        email: 'MARIO@EXAMPLE.COM',
        messaggio: 'Messaggio valido',
      };

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(dataWithUppercaseEmail),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendContactEmail).toHaveBeenCalledWith(
        'Mario Rossi',
        'mario@example.com',
        'Messaggio valido'
      );
    });

    it('should handle multiline messages', async () => {
      mockSendContactEmail.mockResolvedValue({ success: true });

      const dataWithMultilineMessage = {
        nome: 'Mario Rossi',
        email: 'mario@example.com',
        messaggio: 'Prima riga\nSeconda riga\nTerza riga',
      };

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(dataWithMultilineMessage),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendContactEmail).toHaveBeenCalledWith(
        'Mario Rossi',
        'mario@example.com',
        'Prima riga\nSeconda riga\nTerza riga'
      );
    });

    it('should handle special characters in nome', async () => {
      mockSendContactEmail.mockResolvedValue({ success: true });

      const dataWithSpecialChars = {
        nome: "Mario D'Angelo",
        email: 'mario@example.com',
        messaggio: 'Messaggio valido',
      };

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(dataWithSpecialChars),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendContactEmail).toHaveBeenCalledWith(
        "Mario D'Angelo",
        'mario@example.com',
        'Messaggio valido'
      );
    });

    it('should reject messaggio longer than 2000 characters', async () => {
      const longMessage = 'a'.repeat(2001);
      const invalidData = {
        nome: 'Mario Rossi',
        email: 'mario@example.com',
        messaggio: longMessage,
      };

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.details?.messaggio).toBeDefined();
      expect(mockSendContactEmail).not.toHaveBeenCalled();
    });

    it('should accept messaggio with exactly 2000 characters', async () => {
      mockSendContactEmail.mockResolvedValue({ success: true });

      const maxMessage = 'a'.repeat(2000);
      const validData = {
        nome: 'Mario Rossi',
        email: 'mario@example.com',
        messaggio: maxMessage,
      };

      const request = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify(validData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendContactEmail).toHaveBeenCalledWith(
        'Mario Rossi',
        'mario@example.com',
        maxMessage
      );
    });
  });
});
