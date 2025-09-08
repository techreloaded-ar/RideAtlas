import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/profile/route';
import { TestDataFactory } from '@/tests/utils/TestDataFactory';
import { auth } from '@/auth';

// Mock auth
jest.mock('@/auth');
const mockAuth = auth as jest.MockedFunction<typeof auth>;

// Get the mocked prisma from global setup
const mockPrisma = (global as any).mockPrisma;

describe('/api/profile GET', () => {
  let testUser: any;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Crea un utente di test con social links
    testUser = TestDataFactory.createUser({
      id: 'test-user-123',
      name: 'Test User',
      email: 'test@example.com',
      bio: 'Test bio',
      socialLinks: {
        instagram: 'https://instagram.com/testuser',
        youtube: 'https://youtube.com/testuser',
        website: 'https://testuser.com'
      }
    });

    // Mock Prisma per restituire l'utente creato
    mockPrisma.user.findUnique.mockResolvedValue(testUser);

    // Mock della sessione autenticata
    mockAuth.mockResolvedValue({
      user: { id: testUser.id, email: testUser.email },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  });

  afterEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should return complete user profile with social links', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toMatchObject({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        bio: testUser.bio,
        socialLinks: {
          instagram: 'https://instagram.com/testuser',
          youtube: 'https://youtube.com/testuser',
          website: 'https://testuser.com'
        }
      });
      expect(data.user.role).toBeDefined();
      expect(data.user.createdAt).toBeDefined();
      expect(data.user.updatedAt).toBeDefined();
    });

    it('should return empty social links object when user has no social links', async () => {
      // Crea un utente senza social links
      const userWithoutSocial = TestDataFactory.createUser({
        id: 'user-no-social-123',
        name: 'User No Social',
        email: 'nosocial@example.com',
        socialLinks: null
      });

      // Mock Prisma per restituire l'utente senza social links
      mockPrisma.user.findUnique.mockResolvedValue(userWithoutSocial);

      mockAuth.mockResolvedValue({
        user: { id: userWithoutSocial.id, email: userWithoutSocial.email },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.socialLinks).toEqual({});
    });
  });

  describe('Error Cases', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non autorizzato');
    });

    it('should return 404 when user does not exist in database', async () => {
      // Mock Prisma per restituire null (utente non trovato)
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Mock con un ID utente che non esiste
      mockAuth.mockResolvedValue({
        user: { id: 'non-existent-id', email: 'fake@example.com' },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utente non trovato');
    });
  });

  describe('Data Structure', () => {
    it('should return user data with correct structure and types', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('user');
      
      const user = data.user;
      expect(typeof user.id).toBe('string');
      expect(typeof user.name).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(typeof user.role).toBe('string');
      expect(typeof user.createdAt).toBe('string');
      expect(typeof user.updatedAt).toBe('string');
      
      // Bio può essere string o null
      expect(['string', 'object'].includes(typeof user.bio)).toBe(true);
      
      // Social links deve essere un oggetto
      expect(typeof user.socialLinks).toBe('object');
      expect(user.socialLinks).not.toBeNull();
    });
  });
});