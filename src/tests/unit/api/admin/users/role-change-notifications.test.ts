import { PATCH } from '@/app/api/admin/users/[id]/route'
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendRoleChangeNotificationEmail } from '@/lib/email'
import { UserRole } from '@/types/profile'

// Mock delle dipendenze
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/email', () => ({
  sendRoleChangeNotificationEmail: jest.fn(),
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockSendRoleChangeNotificationEmail = sendRoleChangeNotificationEmail as jest.MockedFunction<typeof sendRoleChangeNotificationEmail>

describe('Email notifications for role changes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSendRoleChangeNotificationEmail.mockResolvedValue({ success: true })
  })

  const mockSentinelSession = {
    user: {
      id: 'sentinel-1',
      email: 'sentinel@test.com',
      name: 'Test Sentinel',
      role: UserRole.Sentinel,
    },
  }

  const mockExistingUser = {
    id: 'user-123',
    name: 'Mario Rossi',
    email: 'mario@example.com',
    role: UserRole.Explorer,
  }

  const mockUpdatedUser = {
    id: 'user-123',
    name: 'Mario Rossi',
    email: 'mario@example.com',
    role: UserRole.Ranger,
    emailVerified: new Date('2023-12-01'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-12-01'),
    image: null,
    _count: {
      trips: 3,
    },
  }

  it('should send email notification when role changes', async () => {
    mockAuth.mockResolvedValue(mockSentinelSession as any)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser)
    ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser)

    const request = new NextRequest('http://localhost/api/admin/users/user-123', {
      method: 'PATCH',
      body: JSON.stringify({ role: UserRole.Ranger }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PATCH(request, { params: { id: 'user-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Ruolo utente aggiornato con successo')
    
    // Verifica che l'email sia stata inviata
    expect(mockSendRoleChangeNotificationEmail).toHaveBeenCalledWith(
      'mario@example.com',
      'Mario Rossi',
      UserRole.Ranger,
      'Test Sentinel'
    )
  })

  it('should NOT send email when role does not change', async () => {
    mockAuth.mockResolvedValue(mockSentinelSession as any)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser)
    
    // L'utente ha già il ruolo Explorer, quindi non cambia
    const sameRoleUpdatedUser = { ...mockUpdatedUser, role: UserRole.Explorer }
    ;(prisma.user.update as jest.Mock).mockResolvedValue(sameRoleUpdatedUser)

    const request = new NextRequest('http://localhost/api/admin/users/user-123', {
      method: 'PATCH',
      body: JSON.stringify({ role: UserRole.Explorer }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PATCH(request, { params: { id: 'user-123' } })

    expect(response.status).toBe(200)
    expect(mockSendRoleChangeNotificationEmail).not.toHaveBeenCalled()
  })

  it('should continue operation even if email sending fails', async () => {
    mockAuth.mockResolvedValue(mockSentinelSession as any)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser)
    ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser)
    
    mockSendRoleChangeNotificationEmail.mockRejectedValue(new Error('Email service down'))

    const request = new NextRequest('http://localhost/api/admin/users/user-123', {
      method: 'PATCH',
      body: JSON.stringify({ role: UserRole.Ranger }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PATCH(request, { params: { id: 'user-123' } })
    const data = await response.json()

    // L'operazione dovrebbe comunque riuscire
    expect(response.status).toBe(200)
    expect(data.message).toBe('Ruolo utente aggiornato con successo')
    expect(mockSendRoleChangeNotificationEmail).toHaveBeenCalled()
  })
})
