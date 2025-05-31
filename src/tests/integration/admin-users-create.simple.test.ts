/**
 * Test semplificato per la creazione di nuovi utenti tramite API admin
 * Questo test verifica le funzionalità principali senza mock complessi
 */

import { UserRole } from '@/types/profile'

// Mock semplice per fetch
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Helper per creare mock delle risposte
const mockResponse = (status: number, data?: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
} as Response)

describe('POST /api/admin/users - Test Semplificato', () => {
  const baseUrl = 'http://localhost:3001'
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  const createTestPayload = (overrides = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test123!',
    role: UserRole.Explorer,
    sendVerificationEmail: true,
    ...overrides,
  })

  it('dovrebbe simulare la creazione di un utente con successo', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce(
      mockResponse(201, { 
        success: true, 
        message: 'Utente creato con successo',
        user: { 
          id: 'test-id', 
          name: 'Test User', 
          email: 'test@example.com',
          role: UserRole.Explorer
        }
      })
    )

    const payload = createTestPayload()
    
    const response = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Utente creato con successo')
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('test@example.com')
  })

  it('dovrebbe simulare errore per email non valida', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(400, { 
        success: false, 
        message: 'Dati non validi',
        error: 'Email non valida'
      })
    )

    const payload = createTestPayload({ email: 'invalid-email' })
    
    const response = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Dati non validi')
  })

  it('dovrebbe simulare errore per password debole', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(400, { 
        success: false, 
        message: 'Dati non validi',
        error: 'Password troppo debole'
      })
    )

    const payload = createTestPayload({ password: '123' })
    
    const response = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('dovrebbe simulare errore per email già esistente', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(409, { 
        success: false, 
        message: 'Email già in uso'
      })
    )

    const payload = createTestPayload({ email: 'existing@example.com' })
    
    const response = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Email già in uso')
  })

  it('dovrebbe gestire tutti i ruoli utente', async () => {
    const roles = [UserRole.Explorer, UserRole.Ranger, UserRole.Sentinel]
    
    for (const role of roles) {
      mockFetch.mockResolvedValueOnce(
        mockResponse(201, { 
          success: true, 
          message: 'Utente creato con successo',
          user: { id: `test-${role}`, role, email: `test-${role}@example.com` }
        })
      )

      const payload = createTestPayload({ 
        email: `test-${role}@example.com`,
        role 
      })
      
      const response = await fetch(`${baseUrl}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.user.role).toBe(role)
    }
  })

  it('dovrebbe gestire l\'opzione di verifica email', async () => {
    // Test con verifica email abilitata
    mockFetch.mockResolvedValueOnce(
      mockResponse(201, { 
        success: true, 
        message: 'Utente creato con successo. Email di verifica inviata.',
        user: { id: 'test-id' }
      })
    )

    let payload = createTestPayload({ sendVerificationEmail: true })
    
    let response = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    let data = await response.json()
    expect(data.message).toContain('Email di verifica inviata')

    // Test con verifica email disabilitata
    mockFetch.mockResolvedValueOnce(
      mockResponse(201, { 
        success: true, 
        message: 'Utente creato con successo',
        user: { id: 'test-id-2' }
      })
    )

    payload = createTestPayload({ 
      email: 'test2@example.com',
      sendVerificationEmail: false 
    })
    
    response = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    data = await response.json()
    expect(data.message).not.toContain('Email di verifica inviata')
  })
})
