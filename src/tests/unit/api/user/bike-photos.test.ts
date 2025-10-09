import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies FIRST before any imports
const mockAuth = jest.fn();
const mockPrismaUser = {
  findUnique: jest.fn(),
  update: jest.fn(),
};
const mockGenerateTempMediaId = jest.fn();
const mockCastToMediaItems = jest.fn();

// Mock modules
jest.mock('@/auth', () => ({
  auth: mockAuth,
}));

jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    user: mockPrismaUser,
  },
}));

jest.mock('@/lib/utils/media', () => ({
  generateTempMediaId: mockGenerateTempMediaId,
  castToMediaItems: mockCastToMediaItems,
}));

// Mock NextRequest
const createMockRequest = (body?: any, searchParams?: Record<string, string>): any => {
  const url = searchParams
    ? `http://localhost/api/user/bike-photos?${new URLSearchParams(searchParams).toString()}`
    : 'http://localhost/api/user/bike-photos';

  return {
    json: jest.fn().mockResolvedValue(body || {}),
    url,
    headers: new Map(),
    cookies: new Map(),
  };
};

describe('POST /api/user/bike-photos', () => {
  let POST: any;
  let uploadLimitTracker: any;

  beforeAll(async () => {
    const routeModule = await import('@/app/api/user/bike-photos/route');
    POST = routeModule.POST;
    uploadLimitTracker = routeModule.uploadLimitTracker;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateTempMediaId.mockReturnValue('temp_123456_abc');
    // Clear rate limiting tracker before each test
    uploadLimitTracker.clear();
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest({
        url: 'https://example.com/photo.jpg',
        type: 'image',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non autorizzato');
    });

    it('should reject requests without user ID', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const request = createMockRequest({
        url: 'https://example.com/photo.jpg',
        type: 'image',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non autorizzato');
    });
  });

  describe('Role Authorization', () => {
    it('should reject non-Ranger users (Explorer)', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id', role: 'Explorer' },
      });

      const request = createMockRequest({
        url: 'https://example.com/photo.jpg',
        type: 'image',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Solo gli utenti Ranger possono caricare foto moto');
    });

    it('should allow Ranger users', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id', role: 'Ranger' },
      });
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'test-user-id',
        bikePhotos: [],
      });
      mockCastToMediaItems.mockReturnValue([]);
      mockPrismaUser.update.mockResolvedValue({});

      const request = createMockRequest({
        url: 'https://example.com/photo.jpg',
        type: 'image',
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should allow Sentinel users', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id', role: 'Sentinel' },
      });
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'test-user-id',
        bikePhotos: [],
      });
      mockCastToMediaItems.mockReturnValue([]);
      mockPrismaUser.update.mockResolvedValue({});

      const request = createMockRequest({
        url: 'https://example.com/photo.jpg',
        type: 'image',
      });
      const response = await POST(request);

      // Sentinels are not Ranger role, should be rejected
      expect(response.status).toBe(403);
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id', role: 'Ranger' },
      });
    });

    it('should reject missing url', async () => {
      const request = createMockRequest({ type: 'image' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URL e tipo sono obbligatori');
    });

    it('should reject missing type', async () => {
      const request = createMockRequest({
        url: 'https://example.com/photo.jpg',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URL e tipo sono obbligatori');
    });

    it('should reject non-image type', async () => {
      const request = createMockRequest({
        url: 'https://example.com/video.mp4',
        type: 'video',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Solo immagini sono supportate');
    });

    it('should accept valid image upload', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'test-user-id',
        bikePhotos: [],
      });
      mockCastToMediaItems.mockReturnValue([]);
      mockPrismaUser.update.mockResolvedValue({});

      const request = createMockRequest({
        url: 'https://example.com/photo.jpg',
        type: 'image',
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('Photo Limit', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id', role: 'Ranger' },
      });
    });

    it('should reject upload when user has 10 photos', async () => {
      const existingPhotos = Array.from({ length: 10 }, (_, i) => ({
        id: `photo-${i}`,
        type: 'image',
        url: `https://example.com/photo${i}.jpg`,
        uploadedAt: new Date().toISOString(),
      }));

      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'test-user-id',
        bikePhotos: existingPhotos,
      });
      mockCastToMediaItems.mockReturnValue(existingPhotos);

      const request = createMockRequest({
        url: 'https://example.com/photo-new.jpg',
        type: 'image',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Limite 10 foto raggiunto');
    });

    it('should allow upload when user has 9 photos', async () => {
      const existingPhotos = Array.from({ length: 9 }, (_, i) => ({
        id: `photo-${i}`,
        type: 'image',
        url: `https://example.com/photo${i}.jpg`,
        uploadedAt: new Date().toISOString(),
      }));

      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'test-user-id',
        bikePhotos: existingPhotos,
      });
      mockCastToMediaItems.mockReturnValue(existingPhotos);
      mockPrismaUser.update.mockResolvedValue({});

      const request = createMockRequest({
        url: 'https://example.com/photo-new.jpg',
        type: 'image',
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should return 404 if user not found', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const request = createMockRequest({
        url: 'https://example.com/photo.jpg',
        type: 'image',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utente non trovato');
    });
  });

  describe('Photo Upload', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id', role: 'Ranger' },
      });
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'test-user-id',
        bikePhotos: [],
      });
      mockCastToMediaItems.mockReturnValue([]);
    });

    it('should create media item with correct structure', async () => {
      mockPrismaUser.update.mockResolvedValue({});

      const request = createMockRequest({
        url: 'https://example.com/photo.jpg',
        type: 'image',
        caption: 'My bike',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.media).toMatchObject({
        id: 'temp_123456_abc',
        type: 'image',
        url: 'https://example.com/photo.jpg',
        caption: 'My bike',
        uploadedAt: expect.any(String),
      });
    });

    it('should create media item without caption', async () => {
      mockPrismaUser.update.mockResolvedValue({});

      const request = createMockRequest({
        url: 'https://example.com/photo.jpg',
        type: 'image',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.media.caption).toBeUndefined();
    });

    it('should add photo to user bikePhotos array', async () => {
      mockPrismaUser.update.mockResolvedValue({});

      const request = createMockRequest({
        url: 'https://example.com/photo.jpg',
        type: 'image',
      });
      await POST(request);

      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {
          bikePhotos: {
            push: expect.objectContaining({
              id: 'temp_123456_abc',
              type: 'image',
              url: 'https://example.com/photo.jpg',
            }),
          },
        },
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id', role: 'Ranger' },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaUser.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest({
        url: 'https://example.com/photo.jpg',
        type: 'image',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Errore interno del server');
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        headers: new Map(),
        cookies: new Map(),
      };

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Errore interno del server');
    });
  });
});

describe('DELETE /api/user/bike-photos', () => {
  let DELETE: any;

  beforeAll(async () => {
    const routeModule = await import('@/app/api/user/bike-photos/route');
    DELETE = routeModule.DELETE;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest(undefined, { photoId: 'photo-1' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non autorizzato');
    });

    it('should reject requests without user ID', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const request = createMockRequest(undefined, { photoId: 'photo-1' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non autorizzato');
    });
  });

  describe('Role Authorization', () => {
    it('should reject non-Ranger users', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id', role: 'Explorer' },
      });

      const request = createMockRequest(undefined, { photoId: 'photo-1' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Solo gli utenti Ranger possono eliminare foto moto');
    });
  });

  describe('Photo ID Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id', role: 'Ranger' },
      });
    });

    it('should reject missing photoId', async () => {
      const request = createMockRequest();
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ID foto mancante');
    });
  });

  describe('Photo Deletion', () => {
    const existingPhotos = [
      { id: 'photo-1', type: 'image', url: 'https://example.com/photo1.jpg', uploadedAt: '2024-01-01' },
      { id: 'photo-2', type: 'image', url: 'https://example.com/photo2.jpg', uploadedAt: '2024-01-02' },
      { id: 'photo-3', type: 'image', url: 'https://example.com/photo3.jpg', uploadedAt: '2024-01-03' },
    ];

    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id', role: 'Ranger' },
      });
    });

    it('should delete existing photo', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'test-user-id',
        bikePhotos: existingPhotos,
      });
      mockCastToMediaItems.mockReturnValue(existingPhotos);
      mockPrismaUser.update.mockResolvedValue({});

      const request = createMockRequest(undefined, { photoId: 'photo-2' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Foto eliminata con successo');

      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {
          bikePhotos: [
            { id: 'photo-1', type: 'image', url: 'https://example.com/photo1.jpg', uploadedAt: '2024-01-01' },
            { id: 'photo-3', type: 'image', url: 'https://example.com/photo3.jpg', uploadedAt: '2024-01-03' },
          ],
        },
      });
    });

    it('should reject deleting non-existent photo', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'test-user-id',
        bikePhotos: existingPhotos,
      });
      mockCastToMediaItems.mockReturnValue(existingPhotos);

      const request = createMockRequest(undefined, { photoId: 'non-existent' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Foto non trovata');
    });

    it('should return 404 if user not found', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const request = createMockRequest(undefined, { photoId: 'photo-1' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utente non trovato');
    });

    it('should delete last remaining photo', async () => {
      const singlePhoto = [existingPhotos[0]];

      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'test-user-id',
        bikePhotos: singlePhoto,
      });
      mockCastToMediaItems.mockReturnValue(singlePhoto);
      mockPrismaUser.update.mockResolvedValue({});

      const request = createMockRequest(undefined, { photoId: 'photo-1' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { bikePhotos: [] },
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'test-user-id', role: 'Ranger' },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaUser.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest(undefined, { photoId: 'photo-1' });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Errore interno del server');
    });
  });
});
