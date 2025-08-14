// src/tests/unit/api/trips/optional-fields.test.ts
import { POST } from '@/app/api/trips/route';
import { PUT } from '@/app/api/trips/[id]/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';
import { ensureUserExists } from '@/lib/auth/user-sync';
import { RecommendedSeason } from '@/types/trip';

// Mock delle dipendenze
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    trip: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>


jest.mock('@/lib/auth/user-sync', () => ({
  ensureUserExists: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockEnsureUserExists = ensureUserExists as jest.MockedFunction<typeof ensureUserExists>;

describe('Trip API - Optional Fields Support', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Explorer',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: mockUser,
      expires: '2024-12-31T23:59:59.999Z',
    });
    mockEnsureUserExists.mockResolvedValue(mockUser);
    
    // Mock $transaction per eseguire la callback con il mock prisma
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return callback(mockPrisma);
    });
  });

  const createMockRequest = (body: unknown): NextRequest => {
    return new NextRequest('http://localhost/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  const createMockUpdateRequest = (body: unknown): NextRequest => {
    return new NextRequest('http://localhost/api/trips/trip-123', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  describe('Optional Fields Handling', () => {
    it('shouldAcceptEmptyOptionalFieldsOnCreate', async () => {
      const tripDataWithEmptyOptionals = {
        title: 'Viaggio Minimale',
        summary: 'Un viaggio minimale con campi opzionali vuoti',
        destination: 'Toscana, Italia',
        duration_days: 2,
        duration_nights: 1,
        tags: ['minimalista'],
        theme: 'Viaggio breve',
        characteristics: ['Bel paesaggio'],
        recommended_seasons: [RecommendedSeason.Estate],
      };

      const fullTripInfo = {
        id: 'trip-123',
        ...tripDataWithEmptyOptionals,
        slug: 'viaggio-minimale',
        user_id: 'user-123',
      };

      mockPrisma.trip.findUnique.mockResolvedValue(fullTripInfo)
      mockPrisma.trip.create.mockResolvedValue(fullTripInfo);

      const request = createMockRequest(tripDataWithEmptyOptionals);
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(prisma.trip.create).toHaveBeenCalledWith({
        data: {
          ...tripDataWithEmptyOptionals,
          media: [],
          gpxFile: null,
          travelDate: null,
          slug: 'viaggio-minimale',
          user_id: 'user-123',
          // L'API ricalcola duration basandosi su stages (0 stages = 1 day, 0 nights)
          duration_days: 1,
          duration_nights: 0,
        },
      });
    });

    it('shouldAcceptMinimalRequiredFields', async () => {
      const tripDataMinimal = {
        title: 'Viaggio Minimale',
        summary: 'Un viaggio con solo i campi richiesti',
        destination: 'Umbria, Italia',
        duration_days: 1,
        duration_nights: 1,
        tags: ['veloce'],
        theme: 'Day trip',
        characteristics: ['Strade sterrate'],
        recommended_seasons: [RecommendedSeason.Primavera],
      };

      mockPrisma.trip.create.mockResolvedValue({
        id: 'trip-124',
        ...tripDataMinimal,
        slug: 'viaggio-minimale',
        user_id: 'user-123',
      });

      const request = createMockRequest(tripDataMinimal);
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('shouldAcceptPartialUpdateData', async () => {
      const existingTrip = {
        id: 'trip-123',
        title: 'Viaggio Esistente',
        user_id: 'user-123',
      };

      const updateData = {
        title: 'Titolo Aggiornato',
      };

      (prisma.trip.findUnique as jest.Mock).mockResolvedValue(existingTrip);
      (prisma.trip.update as jest.Mock).mockResolvedValue({
        ...existingTrip,
        ...updateData,
      });

      const request = createMockUpdateRequest(updateData);
      const response = await PUT(request, { params: { id: 'trip-123' } });

      expect(response.status).toBe(200);
    });
  });

  describe('Tags Field', () => {
    it('shouldAcceptEmptyTagsArrayOnCreate', async () => {
      const tripDataWithEmptyTags = {
        title: 'Viaggio Senza Tag',
        summary: 'Un viaggio senza alcun tag associato',
        destination: 'Marche, Italia',
        duration_days: 3,
        duration_nights: 2,
        tags: [], // Array di tag vuoto
        theme: 'Senza categorizzazione',
        characteristics: ['Curve strette'],
        recommended_seasons: [RecommendedSeason.Autunno],
      };

      mockPrisma.trip.create.mockResolvedValue({
        id: 'trip-125',
        ...tripDataWithEmptyTags,
        slug: 'viaggio-senza-tag',
        user_id: 'user-123',
      });

      const request = createMockRequest(tripDataWithEmptyTags);
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(prisma.trip.create).toHaveBeenCalledWith({
        data: {
          ...tripDataWithEmptyTags,
          tags: [], // Dovrebbe accettare array vuoto
          media: [],
          gpxFile: null,
          travelDate: null,
          slug: 'viaggio-senza-tag',
          user_id: 'user-123',
          // L'API ricalcola duration basandosi su stages (0 stages = 1 day, 0 nights)
          duration_days: 1,
          duration_nights: 0,
        },
      });
    });

    it('shouldAcceptEmptyTagsArrayOnUpdate', async () => {
      const existingTrip = {
        id: 'trip-123',
        title: 'Viaggio Esistente',
        user_id: 'user-123',
      };

      const updateData = {
        tags: [], // Rimozione di tutti i tag
      };

      (prisma.trip.findUnique as jest.Mock).mockResolvedValue(existingTrip);
      (prisma.trip.update as jest.Mock).mockResolvedValue({
        ...existingTrip,
        ...updateData,
      });

      const request = createMockUpdateRequest(updateData);
      const response = await PUT(request, { params: { id: 'trip-123' } });

      expect(response.status).toBe(200);
    });

    it('shouldDefaultToEmptyArrayWhenTagsNotProvided', async () => {
      const tripDataWithoutTags = {
        title: 'Viaggio Senza Campo Tags',
        summary: 'Un viaggio dove il campo tags non è specificato',
        destination: 'Lazio, Italia',
        duration_days: 1,
        duration_nights: 0,
        theme: 'Gita giornaliera',
        characteristics: ['Autostrada'],
        recommended_seasons: [RecommendedSeason.Estate],
        // tags field omesso completamente
      };

      mockPrisma.trip.create.mockResolvedValue({
        id: 'trip-126',
        ...tripDataWithoutTags,
        tags: [], // Dovrebbe default a array vuoto
        slug: 'viaggio-senza-campo-tags',
        user_id: 'user-123',
      });

      const request = createMockRequest(tripDataWithoutTags);
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('Combined Optional Fields', () => {
    it('shouldAcceptBothEmptyDescriptionAndEmptyTags', async () => {
      const minimalTripData = {
        title: 'Viaggio Minimo',
        summary: 'Un viaggio con solo i campi essenziali',
        destination: 'Emilia-Romagna, Italia',
        duration_days: 1,
        duration_nights: 1,
        tags: [],
        theme: 'Minimalista',
        characteristics: [],
        recommended_seasons: [RecommendedSeason.Primavera],
      };

      const fullTripInfo = {
         id: 'trip-127',
        ...minimalTripData,
        slug: 'viaggio-minimo',
        user_id: 'user-123',
      };

      mockPrisma.trip.findUnique.mockResolvedValue(fullTripInfo)
      mockPrisma.trip.create.mockResolvedValue(fullTripInfo);

      const request = createMockRequest(minimalTripData);
      const response = await POST(request);

      expect(response.status).toBe(201);
      const responseData = await response.json();
      expect(responseData.id).toBe('trip-127');
    });
  });

  describe('Travel Date Field', () => {
    it('shouldAcceptTravelDateOnCreate', async () => {
      const tripDataWithTravelDate = {
        title: 'Viaggio con Data',
        summary: 'Un viaggio con data specificata',
        destination: 'Sicilia, Italia',
        theme: 'Viaggio storico',
        characteristics: ['Interesse storico-culturale'],
        recommended_seasons: ['Primavera'],
        tags: ['sicilia', 'storia'],
        travelDate: '2023-05-15T00:00:00.000Z'
      };

      mockPrisma.trip.create.mockResolvedValue({
        id: 'trip-126',
        ...tripDataWithTravelDate,
        travelDate: new Date('2023-05-15T00:00:00.000Z'),
        slug: 'viaggio-con-data',
        user_id: 'user-123',
      });

      const request = createMockRequest(tripDataWithTravelDate);
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(prisma.trip.create).toHaveBeenCalledWith({
        data: {
          ...tripDataWithTravelDate,
          media: [],
          gpxFile: null,
          travelDate: new Date('2023-05-15T00:00:00.000Z'),
          slug: 'viaggio-con-data',
          user_id: 'user-123',
          // L'API ricalcola duration basandosi su stages (0 stages = 1 day, 0 nights)
          duration_days: 1,
          duration_nights: 0,
        },
      });
    });

    it('shouldAcceptNullTravelDateOnCreate', async () => {
      const tripDataWithNullTravelDate = {
        title: 'Viaggio senza Data',
        summary: 'Un viaggio senza data specificata',
        destination: 'Calabria, Italia',
        theme: 'Viaggio naturalistico',
        characteristics: ['Bel paesaggio'],
        recommended_seasons: ['Estate'],
        tags: ['calabria', 'natura'],
        travelDate: null
      };

      mockPrisma.trip.create.mockResolvedValue({
        id: 'trip-127',
        ...tripDataWithNullTravelDate,
        slug: 'viaggio-senza-data',
        user_id: 'user-123',
      });

      const request = createMockRequest(tripDataWithNullTravelDate);
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(prisma.trip.create).toHaveBeenCalledWith({
        data: {
          ...tripDataWithNullTravelDate,
          media: [],
          gpxFile: null,
          travelDate: null,
          slug: 'viaggio-senza-data',
          user_id: 'user-123',
          // L'API ricalcola duration basandosi su stages (0 stages = 1 day, 0 nights)
          duration_days: 1,
          duration_nights: 0,
        },
      });
    });
  });
});
