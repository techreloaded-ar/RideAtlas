import { POST } from '@/app/api/auth/resend-verification/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { sendVerificationEmail } from '@/lib/core/email'

// Mock delle dipendenze
jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    emailVerificationToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/core/email', () => ({
  sendVerificationEmail: jest.fn(),
}))

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'new-mock-token-456'),
  })),
}))

const mockSendVerificationEmail = sendVerificationEmail as jest.MockedFunction<typeof sendVerificationEmail>

describe('POST /api/auth/resend-verification - Rinvio Email Verifica', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock Date.now per un timestamp consistente
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000) // 2022-01-01 00:00:00
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const createMockRequest = (body: unknown): NextRequest => {
    return new NextRequest('http://localhost/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  const mockUnverifiedUser = {
    id: 'user-123',
    name: 'Mario Rossi',
    email: 'mario@example.com',
    emailVerified: null,
    password: 'hashed-password',
  }

  const mockVerifiedUser = {
    id: 'user-456',
    name: 'Luigi Verde',
    email: 'luigi@example.com',
    emailVerified: new Date('2023-12-01'),
    password: 'hashed-password',
  }

  describe('Richieste valide', () => {
    it('should successfully resend verification email for unverified user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUnverifiedUser)
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})
      mockSendVerificationEmail.mockResolvedValue({ success: true })

      const request = createMockRequest({ email: 'mario@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Email di verifica inviata con successo')
      expect(data.sent).toBe(true)

      // Verifica che l'utente sia stato cercato
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'mario@example.com' },
      })

      // Verifica che i token precedenti siano stati eliminati
      expect(prisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
        where: { email: 'mario@example.com' },
      })

      // Verifica che sia stato creato un nuovo token
      expect(prisma.emailVerificationToken.create).toHaveBeenCalledWith({
        data: {
          email: 'mario@example.com',
          token: 'new-mock-token-456',
          expiresAt: new Date(1640995200000 + 24 * 60 * 60 * 1000), // +24 ore
        },
      })

      // Verifica che sia stata inviata l'email
      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        'mario@example.com',
        'new-mock-token-456'
      )
    })

    it('should handle user with no previous tokens', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUnverifiedUser)
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})
      mockSendVerificationEmail.mockResolvedValue({ success: true })

      const request = createMockRequest({ email: 'mario@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sent).toBe(true)
      
      // Anche se non ci sono token precedenti, l'operazione dovrebbe comunque funzionare
      expect(prisma.emailVerificationToken.deleteMany).toHaveBeenCalled()
      expect(prisma.emailVerificationToken.create).toHaveBeenCalled()
    })

    it('should handle multiple previous tokens deletion', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUnverifiedUser)
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 3 })
      ;(prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})
      mockSendVerificationEmail.mockResolvedValue({ success: true })

      const request = createMockRequest({ email: 'mario@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sent).toBe(true)
    })
  })

  describe('Errori di validazione', () => {
    it('should return 400 if email is missing', async () => {
      const request = createMockRequest({})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email richiesta')
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should return 400 if email is empty string', async () => {
      const request = createMockRequest({ email: '' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email richiesta')
    })

    it('should return 400 if email is null', async () => {
      const request = createMockRequest({ email: null })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email richiesta')
    })

    it('should return 400 if email is undefined', async () => {
      const request = createMockRequest({ email: undefined })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email richiesta')
    })
  })

  describe('Errori utente', () => {
    it('should return 404 if user does not exist', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest({ email: 'nonexistent@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Utente non trovato')
      expect(prisma.emailVerificationToken.deleteMany).not.toHaveBeenCalled()
      expect(prisma.emailVerificationToken.create).not.toHaveBeenCalled()
      expect(mockSendVerificationEmail).not.toHaveBeenCalled()
    })

    it('should return 400 if user is already verified', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockVerifiedUser)

      const request = createMockRequest({ email: 'luigi@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email già verificata')
      expect(prisma.emailVerificationToken.deleteMany).not.toHaveBeenCalled()
      expect(prisma.emailVerificationToken.create).not.toHaveBeenCalled()
      expect(mockSendVerificationEmail).not.toHaveBeenCalled()
    })

    it('should handle user with emailVerified as Date object', async () => {
      const userWithDateVerified = {
        ...mockUnverifiedUser,
        emailVerified: new Date('2023-01-01'),
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithDateVerified)

      const request = createMockRequest({ email: 'mario@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email già verificata')
    })
  })

  describe('Errori invio email', () => {
    beforeEach(() => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUnverifiedUser)
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})
    })

    it('should return 500 if email sending fails', async () => {
      mockSendVerificationEmail.mockResolvedValue({ 
        success: false, 
        error: 'SMTP connection failed' 
      })

      const request = createMockRequest({ email: 'mario@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore nell\'invio dell\'email di verifica. Riprova più tardi.')

      // Verifica che i token siano stati comunque creati
      expect(prisma.emailVerificationToken.create).toHaveBeenCalled()
    })

    it('should handle email service returning false success', async () => {
      mockSendVerificationEmail.mockResolvedValue({ success: false })

      const request = createMockRequest({ email: 'mario@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore nell\'invio dell\'email di verifica. Riprova più tardi.')
    })

    it('should handle email service throwing exception', async () => {
      mockSendVerificationEmail.mockRejectedValue(new Error('Email service unavailable'))

      const request = createMockRequest({ email: 'mario@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })
  })

  describe('Errori database', () => {
    it('should handle database error during user lookup', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest({ email: 'mario@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })

    it('should handle database error during token deletion', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUnverifiedUser)
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockRejectedValue(
        new Error('Delete operation failed')
      )

      const request = createMockRequest({ email: 'mario@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })

    it('should handle database error during token creation', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUnverifiedUser)
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.emailVerificationToken.create as jest.Mock).mockRejectedValue(
        new Error('Token creation failed')
      )

      const request = createMockRequest({ email: 'mario@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })

    it('should handle constraint violation during token creation', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUnverifiedUser)
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.emailVerificationToken.create as jest.Mock).mockRejectedValue({
        code: 'P2002',
        message: 'Unique constraint violation',
      })

      const request = createMockRequest({ email: 'mario@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })
  })

  describe('Gestione JSON malformato', () => {
    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost/api/auth/resend-verification', {
        method: 'POST',
        body: 'invalid-json-string',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })

    it('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost/api/auth/resend-verification', {
        method: 'POST',
        body: '',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })
  })

  describe('Edge cases', () => {
    it('should handle email with different casing', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUnverifiedUser)
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})
      mockSendVerificationEmail.mockResolvedValue({ success: true })

      const request = createMockRequest({ email: 'MARIO@EXAMPLE.COM' })
      const response = await POST(request)

      expect(response.status).toBe(200)
      
      // Verifica che l'email sia stata passata così com'è
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'MARIO@EXAMPLE.COM' },
      })
    })

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com'
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUnverifiedUser,
        email: longEmail,
      })
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})
      mockSendVerificationEmail.mockResolvedValue({ success: true })

      const request = createMockRequest({ email: longEmail })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should handle extra properties in request body', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUnverifiedUser)
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})
      mockSendVerificationEmail.mockResolvedValue({ success: true })

      const request = createMockRequest({ 
        email: 'mario@example.com',
        extraField: 'should be ignored',
        anotherField: 123,
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })
})
