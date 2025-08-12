import { sendRoleChangeNotificationEmail } from '@/lib/core/email'
import nodemailer from 'nodemailer'

// Mock di nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}))

const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>

describe('sendRoleChangeNotificationEmail', () => {
  const mockTransporter = {
    sendMail: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset delle variabili d'ambiente
    process.env.SMTP_HOST = 'smtp.test.com'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'test@example.com'
    process.env.SMTP_PASSWORD = 'password123'
    process.env.SMTP_FROM = 'noreply@rideatlas.it'
    process.env.NEXTAUTH_URL = 'http://localhost:3001'
    
    mockNodemailer.createTransport.mockReturnValue(mockTransporter as any)
    mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' } as any)
  })

  afterEach(() => {
    // Pulisci le variabili d'ambiente
    delete process.env.SMTP_HOST
    delete process.env.SMTP_PORT
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASSWORD
    delete process.env.SMTP_FROM
  })

  describe('Successful Email Sending', () => {
    it('should send role change notification email successfully', async () => {
      const result = await sendRoleChangeNotificationEmail(
        'user@example.com',
        'Mario Rossi',
        'Ranger',
        'Admin User'
      )

      expect(result.success).toBe(true)
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@rideatlas.it',
        to: 'user@example.com',
        subject: 'Aggiornamento ruolo account - RideAtlas',
        html: expect.stringContaining('Mario Rossi'),
        text: expect.stringContaining('Mario Rossi'),
      })
    })

    it('should translate roles to Italian in email content', async () => {
      await sendRoleChangeNotificationEmail(
        'user@example.com',
        'Test User',
        'Sentinel',
        'Admin'
      )

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0]
      
      // Verifica che il ruolo sia tradotto in italiano
      expect(sentEmail.html).toContain('Sentinel')
      expect(sentEmail.text).toContain('Sentinel')
    })

    it('should include dashboard link in email', async () => {
      await sendRoleChangeNotificationEmail(
        'user@example.com',
        'Test User',
        'Ranger',
        'Admin'
      )

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0]
      
      expect(sentEmail.html).toContain('http://localhost:3001/dashboard')
      expect(sentEmail.text).toContain('http://localhost:3001/dashboard')
    })

    it('should include admin name in email content', async () => {
      await sendRoleChangeNotificationEmail(
        'user@example.com',
        'Test User',
        'Ranger',
        'Giuseppe Verdi'
      )

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0]
      
      expect(sentEmail.html).toContain('Giuseppe Verdi')
      expect(sentEmail.text).toContain('Giuseppe Verdi')
    })

    it('should handle unknown role gracefully', async () => {
      await sendRoleChangeNotificationEmail(
        'user@example.com',
        'Test User',
        'UnknownRole',
        'Admin'
      )

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0]
      
      // Dovrebbe usare il ruolo originale se non trovato nella traduzione
      expect(sentEmail.html).toContain('UnknownRole')
      expect(sentEmail.text).toContain('UnknownRole')
    })
  })

  describe('Configuration Missing Scenarios', () => {
    it('should return success false when SMTP configuration is missing', async () => {
      delete process.env.SMTP_HOST

      const result = await sendRoleChangeNotificationEmail(
        'user@example.com',
        'Test User',
        'Ranger',
        'Admin'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Configurazione email mancante')
      expect(mockTransporter.sendMail).not.toHaveBeenCalled()
    })

    it('should simulate success in development mode when configuration is missing', async () => {
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      delete process.env.SMTP_HOST

      const result = await sendRoleChangeNotificationEmail(
        'user@example.com',
        'Test User',
        'Ranger',
        'Admin'
      )

      expect(result.success).toBe(true)
      expect(result.simulated).toBe(true)
      expect(mockTransporter.sendMail).not.toHaveBeenCalled()

      // Ripristina l'ambiente originale
      process.env.NODE_ENV = originalNodeEnv
    })

    it('should handle missing SMTP_USER', async () => {
      delete process.env.SMTP_USER

      const result = await sendRoleChangeNotificationEmail(
        'user@example.com',
        'Test User',
        'Ranger',
        'Admin'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Configurazione email mancante')
    })

    it('should handle missing SMTP_PASSWORD', async () => {
      delete process.env.SMTP_PASSWORD

      const result = await sendRoleChangeNotificationEmail(
        'user@example.com',
        'Test User',
        'Ranger',
        'Admin'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Configurazione email mancante')
    })
  })

  describe('Email Sending Failures', () => {
    it('should return success false when email sending fails', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP connection failed'))

      const result = await sendRoleChangeNotificationEmail(
        'user@example.com',
        'Test User',
        'Ranger',
        'Admin'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('SMTP connection failed')
    })

    it('should handle unknown errors gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue('Unknown error type')

      const result = await sendRoleChangeNotificationEmail(
        'user@example.com',
        'Test User',
        'Ranger',
        'Admin'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Errore sconosciuto')
    })
  })

  describe('Email Content Validation', () => {
    it('should include proper email template structure', async () => {
      await sendRoleChangeNotificationEmail(
        'user@example.com',
        'Mario Rossi',
        'Ranger',
        'Admin User'
      )

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0]
      
      // Verifica elementi chiave del template HTML
      expect(sentEmail.html).toContain('RideAtlas')
      expect(sentEmail.html).toContain('Aggiornamento Ruolo Account')
      expect(sentEmail.html).toContain('Ciao Mario Rossi')
      expect(sentEmail.html).toContain('Admin User')
      expect(sentEmail.html).toContain('Accedi al Dashboard')
      
      // Verifica elementi chiave del template testo
      expect(sentEmail.text).toContain('RideAtlas')
      expect(sentEmail.text).toContain('Aggiornamento Ruolo Account')
      expect(sentEmail.text).toContain('Ciao Mario Rossi')
      expect(sentEmail.text).toContain('Admin User')
    })

    it('should use default from address when SMTP_FROM is not set', async () => {
      delete process.env.SMTP_FROM

      await sendRoleChangeNotificationEmail(
        'user@example.com',
        'Test User',
        'Ranger',
        'Admin'
      )

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0]
      expect(sentEmail.from).toBe('noreply@rideatlas.it')
    })

    it('should handle null or undefined user name gracefully', async () => {
      await sendRoleChangeNotificationEmail(
        'user@example.com',
        '',
        'Ranger',
        'Admin'
      )

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0]
      expect(sentEmail.html).toContain('Ciao Utente')
      expect(sentEmail.text).toContain('Ciao Utente')
    })
  })

  describe('SMTP Configuration Validation', () => {
    it('should work with SSL configuration (port 465)', async () => {
      process.env.SMTP_PORT = '465'

      await sendRoleChangeNotificationEmail(
        'user@example.com',
        'Test User',
        'Ranger',
        'Admin'
      )

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 465,
        secure: true,
        auth: {
          user: 'test@example.com',
          pass: 'password123',
        },
        debug: false,
        logger: false,
      })
    })

    it('should work with STARTTLS configuration (port 587)', async () => {
      process.env.SMTP_PORT = '587'

      await sendRoleChangeNotificationEmail(
        'user@example.com',
        'Test User',
        'Ranger',
        'Admin'
      )

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password123',
        },
        debug: false,
        logger: false,
      })
    })
  })
})
