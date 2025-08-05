// src/tests/unit/api/trips/optional-fields.test.ts
import { POST } from '@/app/api/trips/route';
import { PUT } from '@/app/api/trips/[id]/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ensureUserExists } from '@/lib/user-sync';
import { RecommendedSeason } from '@/types/trip';

// Mock delle dipendenze
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    trip: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>


jest.mock('@/lib/user-sync', () => ({
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

  describe('Description Field (insights)', () => {
    it('shouldAcceptEmptyDescriptionOnCreate', async () => {
      const tripDataWithEmptyDescription = {
        title: 'Viaggio Senza Descrizione',
        summary: 'Un viaggio minimale senza descrizione dettagliata',
        destination: 'Toscana, Italia',
        duration_days: 2,
        duration_nights: 1,
        tags: ['minimalista'],
        theme: 'Viaggio breve',
        characteristics: ['Bel paesaggio'],
        recommended_seasons: [RecommendedSeason.Estate],
        insights: '', // Campo descrizione vuoto
      };

      const fullTripInfo = {
        id: 'trip-123',
        ...tripDataWithEmptyDescription,
        slug: 'viaggio-senza-descrizione',
        user_id: 'user-123',
      };

      mockPrisma.trip.findUnique.mockResolvedValue(fullTripInfo)
      mockPrisma.trip.create.mockResolvedValue(fullTripInfo);

      const request = createMockRequest(tripDataWithEmptyDescription);
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(prisma.trip.create).toHaveBeenCalledWith({
        data: {
          ...tripDataWithEmptyDescription,
          insights: '', // Dovrebbe accettare stringa vuota
          slug: 'viaggio-senza-descrizione',
          user_id: 'user-123',
        },
      });
    });

    it('shouldAcceptNullDescriptionOnCreate', async () => {
      const tripDataWithNullDescription = {
        title: 'Viaggio Con Null Description',
        summary: 'Un viaggio con description null',
        destination: 'Umbria, Italia',
        duration_days: 1,
        duration_nights: 1,
        tags: ['veloce'],
        theme: 'Day trip',
        characteristics: ['Strade sterrate'],
        recommended_seasons: [RecommendedSeason.Primavera],
        insights: null, // Campo descrizione null
      };

      mockPrisma.trip.create.mockResolvedValue({
        id: 'trip-124',
        ...tripDataWithNullDescription,
        slug: 'viaggio-con-null-description',
        user_id: 'user-123',
      });

      const request = createMockRequest(tripDataWithNullDescription);
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('shouldAcceptEmptyDescriptionOnUpdate', async () => {
      const existingTrip = {
        id: 'trip-123',
        title: 'Viaggio Esistente',
        user_id: 'user-123',
      };

      const updateData = {
        insights: '', // Aggiornamento con descrizione vuota
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
        insights: 'Dettagli del viaggio qui',
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
          slug: 'viaggio-senza-tag',
          user_id: 'user-123',
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
        insights: '',
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
});
