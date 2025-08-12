import { GET, POST } from '@/app/api/auth/verify-email/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'

// Mock delle dipendenze
jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    emailVerificationToken: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/auth/verify-email', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000) // 2022-01-01 00:00:00
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockToken = 'valid-token-123'
  const mockEmail = 'user@example.com'
  const mockValidToken = {
    token: mockToken,
    email: mockEmail,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Token valido (futuro)
  }
  const mockExpiredToken = {
    ...mockValidToken,
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Token scaduto (passato)
  }
  const mockUser = {
    id: 'user-123',
    email: mockEmail,
    emailVerified: null,
  }
  const mockVerifiedUser = {
    ...mockUser,
    emailVerified: new Date(),
  }

  describe('GET', () => {
    it('should successfully verify email with valid token', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(mockValidToken as any)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.user.update.mockResolvedValue(mockVerifiedUser as any)
      mockPrisma.emailVerificationToken.delete.mockResolvedValue({} as any)

      const request = new NextRequest(`http://localhost/api/auth/verify-email?token=${mockToken}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Email verificata con successo!')
      expect(data.verified).toBe(true)
      
      // Verifica che l'utente sia stato aggiornato
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { email: mockEmail },
        data: { emailVerified: expect.any(Date) },
      })
      
      // Verifica che il token sia stato eliminato
      expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalledWith({
        where: { token: mockToken },
      })
    })

    it('should return 400 if token is missing', async () => {
      const request = new NextRequest('http://localhost/api/auth/verify-email')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Token di verifica mancante')
    })

    it('should return 400 if token is invalid', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(null)
      mockPrisma.user.findFirst.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost/api/auth/verify-email?token=${mockToken}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Token di verifica non valido')
    })

    it('should return 400 if token is expired', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(mockExpiredToken as any)
      mockPrisma.emailVerificationToken.delete.mockResolvedValue({} as any)

      const request = new NextRequest(`http://localhost/api/auth/verify-email?token=${mockToken}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Token di verifica scaduto')
      
      // Verifica che il token scaduto sia stato eliminato
      expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalledWith({
        where: { token: mockToken },
      })
    })

    it('should return success if user is already verified', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(mockValidToken as any)
      mockPrisma.user.findUnique.mockResolvedValue(mockVerifiedUser as any)
      mockPrisma.emailVerificationToken.delete.mockResolvedValue({} as any)

      const request = new NextRequest(`http://localhost/api/auth/verify-email?token=${mockToken}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Email già verificata con successo!')
      expect(data.verified).toBe(true)
      expect(data.alreadyVerified).toBe(true)
      
      // Verifica che il token sia stato eliminato
      expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalledWith({
        where: { token: mockToken },
      })
      
      // Verifica che non sia stato fatto un update dell'utente
      expect(mockPrisma.user.update).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest(`http://localhost/api/auth/verify-email?token=${mockToken}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })

    it('should return success if another user with verified email exists (fallback scenario)', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(null)
      mockPrisma.user.findFirst.mockResolvedValue(mockVerifiedUser as any)

      const request = new NextRequest(`http://localhost/api/auth/verify-email?token=${mockToken}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Email già verificata con successo!')
      expect(data.verified).toBe(true)
      expect(data.alreadyVerified).toBe(true)
    })
  })

  describe('POST', () => {
    it('should successfully verify email with valid token via POST', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(mockValidToken as any)
      mockPrisma.user.update.mockResolvedValue(mockVerifiedUser as any)
      mockPrisma.emailVerificationToken.delete.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: mockToken }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Email verificata con successo!')
      expect(data.verified).toBe(true)
      
      // Verifica che l'utente sia stato aggiornato
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { email: mockEmail },
        data: { emailVerified: expect.any(Date) },
      })
      
      // Verifica che il token sia stato eliminato
      expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalledWith({
        where: { token: mockToken },
      })
    })

    it('should return 400 if token is missing in POST body', async () => {
      const request = new NextRequest('http://localhost/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Token di verifica mancante')
    })

    it('should return 400 if token is invalid via POST', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: mockToken }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Token di verifica non valido')
    })

    it('should return 400 if token is expired via POST', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(mockExpiredToken as any)
      mockPrisma.emailVerificationToken.delete.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: mockToken }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Token di verifica scaduto')
      
      // Verifica che il token scaduto sia stato eliminato
      expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalledWith({
        where: { token: mockToken },
      })
    })

    it('should handle malformed JSON in POST request', async () => {
      const request = new NextRequest('http://localhost/api/auth/verify-email', {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })

    it('should handle database errors gracefully in POST', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: mockToken }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })
  })
})
