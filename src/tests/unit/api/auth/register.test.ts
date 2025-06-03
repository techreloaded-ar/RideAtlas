import { POST } from '@/app/api/auth/register/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '@/lib/email'

// Mock delle dipendenze
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

jest.mock('@/lib/email', () => ({
  sendVerificationEmail: jest.fn(),
}))

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'mock-token-123'),
  })),
}))

const mockSendVerificationEmail = sendVerificationEmail as jest.MockedFunction<typeof sendVerificationEmail>

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock Date.now per un timestamp consistente
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000) // 2022-01-01 00:00:00
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('POST', () => {
    const validUserData = {
      name: 'Mario Rossi',
      email: 'mario@example.com',
      password: 'Password123!',
    }

    const mockUser = {
      id: 'user-123',
      name: 'Mario Rossi',
      email: 'mario@example.com',
      role: 'Explorer',
      createdAt: new Date(),
    }

    it('should successfully register a new user', async () => {
      // Setup mocks
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
      mockSendVerificationEmail.mockResolvedValue({ success: true })

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validUserData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toContain('Registrazione completata!')
      expect(data.requiresVerification).toBe(true)
      expect(data.email).toBe(validUserData.email)
      
      // Verifica che sia stato chiamato il hash della password
      expect(bcrypt.hash).toHaveBeenCalledWith(validUserData.password, 12)
      
      // Verifica che l'utente sia stato creato
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: validUserData.name,
          email: validUserData.email,
          password: 'hashed-password',
          emailVerified: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      })
      
      // Verifica che sia stato creato il token di verifica
      expect(prisma.emailVerificationToken.create).toHaveBeenCalled()
      
      // Verifica che sia stata inviata l'email
      expect(mockSendVerificationEmail).toHaveBeenCalledWith(
        validUserData.email,
        'mock-token-123'
      )
    })

    it('should return 409 if user already exists', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validUserData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Un utente con questa email esiste già')
      expect(prisma.user.create).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid data - missing name', async () => {
      const invalidData = { ...validUserData, name: '' }

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi')
      expect(data.details).toHaveProperty('name')
    })

    it('should return 400 for invalid email format', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' }

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi')
      expect(data.details).toHaveProperty('email')
    })

    it('should return 400 for short password', async () => {
      const invalidData = { ...validUserData, password: '123' }

      const request = new NextRequest('http://localhost/api/auth/register', {
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

    it('should rollback user creation if email sending fails', async () => {
      // Setup mocks
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.emailVerificationToken.create as jest.Mock).mockResolvedValue({})
      ;(prisma.user.delete as jest.Mock).mockResolvedValue({})
      ;(prisma.emailVerificationToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
      mockSendVerificationEmail.mockResolvedValue({ success: false, error: 'Email send failed' })

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validUserData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Errore nell\'invio dell\'email di verifica')
      
      // Verifica che l'utente sia stato eliminato per rollback
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      })
      
      // Verifica che i token siano stati eliminati per rollback
      expect(prisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
        where: { email: validUserData.email },
      })
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validUserData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })
  })
})
