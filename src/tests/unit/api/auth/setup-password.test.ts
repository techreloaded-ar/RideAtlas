import { GET, POST } from '@/app/api/auth/setup-password/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Mock delle dipendenze
jest.mock('@/lib/prisma', () => ({
  prisma: {
    emailVerificationToken: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('/api/auth/setup-password', () => {
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
    password: null, // Utente senza password impostata
  }
  const mockUserWithPassword = {
    ...mockUser,
    password: 'existing-hashed-password',
  }

  describe('GET - Token Validation', () => {
    it('should return valid=true for valid token and user without password', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(mockValidToken as any)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)

      const request = new NextRequest(`http://localhost/api/auth/setup-password?token=${mockToken}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(true)
      expect(data.message).toBe('Token valido')
    })

    it('should return 400 if token is missing', async () => {
      const request = new NextRequest('http://localhost/api/auth/setup-password')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Token mancante')
    })

    it('should return 400 if token is invalid', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost/api/auth/setup-password?token=${mockToken}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.valid).toBe(false)
      expect(data.error).toBe('Token non valido')
    })

    it('should return 400 if token is expired', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(mockExpiredToken as any)
      mockPrisma.emailVerificationToken.delete.mockResolvedValue({} as any)

      const request = new NextRequest(`http://localhost/api/auth/setup-password?token=${mockToken}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.valid).toBe(false)
      expect(data.error).toBe('Token scaduto')
      
      // Verifica che il token scaduto sia stato eliminato
      expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalledWith({
        where: { token: mockToken },
      })
    })

    it('should return 404 if user not found', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(mockValidToken as any)
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost/api/auth/setup-password?token=${mockToken}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.valid).toBe(false)
      expect(data.error).toBe('Utente non trovato')
    })

    it('should return 400 if user already has password set', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(mockValidToken as any)
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithPassword as any)

      const request = new NextRequest(`http://localhost/api/auth/setup-password?token=${mockToken}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.valid).toBe(false)
      expect(data.error).toBe('Password già impostata per questo utente')
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest(`http://localhost/api/auth/setup-password?token=${mockToken}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.valid).toBe(false)
      expect(data.error).toBe('Errore interno del server')
    })
  })

  describe('POST - Password Setup', () => {
    const validPassword = 'NewPassword123!'
    const validRequestData = {
      token: mockToken,
      password: validPassword,
    }

    it('should successfully set password with valid data', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(mockValidToken as any)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, password: 'hashed-password' } as any)
      mockPrisma.emailVerificationToken.delete.mockResolvedValue({} as any)
      mockBcrypt.hash.mockResolvedValue('hashed-password')

      const request = new NextRequest('http://localhost/api/auth/setup-password', {
        method: 'POST',
        body: JSON.stringify(validRequestData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Password impostata con successo!')
      
      // Verifica che la password sia stata hashata
      expect(mockBcrypt.hash).toHaveBeenCalledWith(validPassword, 12)
      
      // Verifica che l'utente sia stato aggiornato
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          password: 'hashed-password',
          emailVerified: expect.any(Date),
        },
      })
      
      // Verifica che il token sia stato eliminato
      expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalledWith({
        where: { token: mockToken },
      })
    })

    it('should return 400 for missing token', async () => {
      const invalidData = { password: validPassword }

      const request = new NextRequest('http://localhost/api/auth/setup-password', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi')
      expect(data.details).toHaveProperty('token')
    })

    it('should return 400 for short password', async () => {
      const invalidData = { ...validRequestData, password: '123' }

      const request = new NextRequest('http://localhost/api/auth/setup-password', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi')
      expect(data.details).toHaveProperty('password')
    })

    it('should return 400 for password without uppercase letter', async () => {
      const invalidData = { ...validRequestData, password: 'newpassword123!' }

      const request = new NextRequest('http://localhost/api/auth/setup-password', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi')
      expect(data.details).toHaveProperty('password')
    })

    it('should return 400 for password without lowercase letter', async () => {
      const invalidData = { ...validRequestData, password: 'NEWPASSWORD123!' }

      const request = new NextRequest('http://localhost/api/auth/setup-password', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi')
      expect(data.details).toHaveProperty('password')
    })

    it('should return 400 for password without number', async () => {
      const invalidData = { ...validRequestData, password: 'NewPassword!' }

      const request = new NextRequest('http://localhost/api/auth/setup-password', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi')
      expect(data.details).toHaveProperty('password')
    })

    it('should return 400 for invalid token', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/auth/setup-password', {
        method: 'POST',
        body: JSON.stringify(validRequestData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Token non valido')
    })

    it('should return 400 for expired token', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(mockExpiredToken as any)
      mockPrisma.emailVerificationToken.delete.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/auth/setup-password', {
        method: 'POST',
        body: JSON.stringify(validRequestData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Token scaduto')
      
      // Verifica che il token scaduto sia stato eliminato
      expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalledWith({
        where: { token: mockToken },
      })
    })

    it('should return 404 if user not found', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(mockValidToken as any)
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/auth/setup-password', {
        method: 'POST',
        body: JSON.stringify(validRequestData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Utente non trovato')
    })

    it('should return 400 if user already has password and clean up token', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(mockValidToken as any)
      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithPassword as any)
      mockPrisma.emailVerificationToken.delete.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/auth/setup-password', {
        method: 'POST',
        body: JSON.stringify(validRequestData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password già impostata per questo utente')
      
      // Verifica che il token sia stato eliminato
      expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalledWith({
        where: { token: mockToken },
      })
    })

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost/api/auth/setup-password', {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.emailVerificationToken.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/auth/setup-password', {
        method: 'POST',
        body: JSON.stringify(validRequestData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })
  })
})
