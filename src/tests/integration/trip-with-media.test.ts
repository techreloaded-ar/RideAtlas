// src/tests/integration/trip-with-media.test.ts
import { POST as createTripHandler } from '@/app/api/trips/route';
import { GET as getTripHandler, PUT as updateTripHandler } from '@/app/api/trips/[id]/route';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';
import { MediaItem } from '@/types/trip';
import { NextRequest } from 'next/server';

// Mock delle dipendenze
jest.mock('@/auth', () => ({
  auth: jest.fn()
}));

jest.mock('@/lib/auth/user-sync', () => ({
  ensureUserExists: jest.fn().mockImplementation(async (session) => ({
    id: session?.user?.id || 'mock-user-id',
    name: session?.user?.name || 'Mock User'
  }))
}));

jest.mock('@/lib/core/prisma', () => {
  const originalPrisma = jest.requireActual('@/lib/core/prisma');
  const tripCreateMock = jest.fn();
  const tripUpdateMock = jest.fn();
  const tripFindUniqueMock = jest.fn();
  const tripDeleteMock = jest.fn();
  const stageCreateManyMock = jest.fn();

  const prismaMock = {
    ...originalPrisma.prisma,
    trip: {
      create: tripCreateMock,
      update: tripUpdateMock,
      findUnique: tripFindUniqueMock,
      delete: tripDeleteMock,
    },
    stage: {
      createMany: stageCreateManyMock,
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback({
        trip: {
          create: tripCreateMock,
          update: tripUpdateMock,
          findUnique: tripFindUniqueMock,
          delete: tripDeleteMock,
        },
        stage: {
          createMany: stageCreateManyMock,
        },
      });
    }),
  };

  return { prisma: prismaMock };
});

// Utility per creare un mock di NextRequest
const createMockRequest = (body: any, params = {}) => {
  return {
    json: jest.fn().mockResolvedValue(body),
    params: params
  } as unknown as NextRequest;
};

// Mock per i route params
const mockParams = (id: string) => ({
  params: { id }
});

describe('Trip API con Media Integration', () => {
  // Dati di esempio
  const mockMediaItems: MediaItem[] = [
    {
      id: 'media-1',
      type: 'image',
      url: 'https://example.com/image.jpg',
      caption: 'Immagine di test'
    },
    {
      id: 'media-2',
      type: 'video',
      url: 'https://www.youtube.com/embed/abcdef12345',
      thumbnailUrl: 'https://img.youtube.com/vi/abcdef12345/maxresdefault.jpg',
      caption: 'Video di test'
    }
  ];
  
  const mockTrip = {
    id: 'trip-123',
    title: 'Viaggio Test con Media',
    summary: 'Un viaggio di test per verificare la funzionalità dei media',
    destination: 'Destinazione test',
    duration_days: 5,
    duration_nights: 4,
    tags: ['test', 'media', 'integrazione'],    theme: 'Avventura',
    characteristics: ['Percorso panoramico', 'Strade di montagna'],
    recommended_seasons: ['Estate'],
    media: mockMediaItems,
    slug: 'viaggio-test-con-media',
    status: 'Bozza',
    created_at: new Date(),
    updated_at: new Date(),
    user_id: 'user-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock dell'autenticazione
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', name: 'Test User', role: 'Ranger' }
    });
    
    // Mock delle risposte del database  
    (prisma.trip.create as jest.Mock).mockImplementation(({ data }) => {
      return Promise.resolve({
        ...mockTrip,
        id: 'trip-123',
        ...data,  // Include i media se passati
        slug: data.title ? data.title.toLowerCase().replace(/\s+/g, '-') : mockTrip.slug
      });
    });
    
    (prisma.trip.update as jest.Mock).mockResolvedValue(mockTrip);
    
    (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
  });
  
  describe('Creazione viaggi con media', () => {
    it('deve creare un viaggio con media allegati', async () => {
      // Prepara i dati per la richiesta di creazione
      const tripData = {
        title: 'Viaggio Test con Media',
        summary: 'Un viaggio di test per verificare la funzionalità dei media',
        destination: 'Destinazione test',
        duration_days: 5,
        duration_nights: 4,
        tags: ['test', 'media', 'integrazione'],        
        theme: 'Avventura',
        characteristics: ['Percorso panoramico', 'Strade di montagna'],
        recommended_seasons: ['Estate'],
        media: mockMediaItems
      };
      
      const request = createMockRequest(tripData);
      const response = await createTripHandler(request);
      const result = await response.json();
      
      // Verifica che il viaggio sia stato creato con successo
      expect(response.status).toBe(201);
      expect(prisma.trip.create).toHaveBeenCalled();
      
      // Verifica che il create sia stato chiamato con i media direttamente
      const createCall = (prisma.trip.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.media).toEqual(mockMediaItems);
      expect(createCall.data.title).toBe('Viaggio Test con Media');
      
      // Verifica che il risultato contenga i media
      expect(result.media).toEqual(mockMediaItems);
    });
    
    it('deve creare un viaggio senza media se non specificati', async () => {
      // Prepara i dati per la richiesta di creazione senza media
      const tripData = {
        title: 'Viaggio Test Senza Media',
        summary: 'Un viaggio di test senza media allegati',
        destination: 'Destinazione test',
        duration_days: 3,
        duration_nights: 2,
        tags: ['test', 'senza-media'],
        theme: 'Relax',        
        characteristics: ['Spiaggia', 'Mare'],
        recommended_seasons: ['Estate']
      };
      
      const request = createMockRequest(tripData);
      const response = await createTripHandler(request);
      const result = await response.json();
      
      // Verifica che il viaggio sia stato creato con successo
      expect(response.status).toBe(201);
      expect(prisma.trip.create).toHaveBeenCalled();
      
      // Verifica che il create sia stato chiamato con media vuoto (default)
      const createCall = (prisma.trip.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.media).toEqual([]); // Dovrebbe avere array vuoto per default
      expect(createCall.data.title).toBe('Viaggio Test Senza Media');
    });
  });
  
  describe('Recupero viaggi con media', () => {
    it('deve recuperare un viaggio con i suoi media', async () => {
      const request = createMockRequest({}, { id: 'trip-123' });
      const response = await getTripHandler(request, mockParams('trip-123'));
      const result = await response.json();
      
      expect(result).toHaveProperty('media');
      expect(result.media).toEqual(mockMediaItems);
      expect(result.media.length).toBe(2);
    });
  });
  
  describe('Aggiornamento viaggi con media', () => {
    it('deve aggiornare un viaggio aggiungendo nuovi media', async () => {
      // Aggiungi un nuovo media
      const updatedMediaItems = [
        ...mockMediaItems,
        {
          id: 'media-3',
          type: 'image',
          url: 'https://example.com/new-image.jpg',
          caption: 'Nuova immagine aggiunta'
        }
      ];
      
      const updateData = {
        media: updatedMediaItems
      };
      
      const request = createMockRequest(updateData, { id: 'trip-123' });
      const response = await updateTripHandler(request, mockParams('trip-123'));
      
      // Verifica che l'aggiornamento sia avvenuto con successo
      expect(response.status).toBe(200);
      expect(prisma.trip.update).toHaveBeenCalled();
      
      // Verifica che l'update sia stato chiamato con i media aggiornati
      const updateCall = (prisma.trip.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.media).toEqual(updatedMediaItems);
      expect(updateCall.data.media.length).toBe(3);
    });
    
    it('deve aggiornare un viaggio rimuovendo media esistenti', async () => {
      // Rimuovi un media esistente
      const updatedMediaItems = [mockMediaItems[0]]; // Solo il primo media
      
      const updateData = {
        media: updatedMediaItems
      };
      
      const request = createMockRequest(updateData, { id: 'trip-123' });
      const response = await updateTripHandler(request, mockParams('trip-123'));
      
      // Verifica che l'aggiornamento sia avvenuto con successo
      expect(response.status).toBe(200);
      expect(prisma.trip.update).toHaveBeenCalled();
      
      // Verifica che l'update sia stato chiamato con i media aggiornati
      const updateCall = (prisma.trip.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.media).toEqual(updatedMediaItems);
      expect(updateCall.data.media.length).toBe(1);
    });
    
    it('deve aggiornare le didascalie dei media', async () => {
      // Aggiorna le didascalie
      const updatedMediaItems = [
        {
          ...mockMediaItems[0],
          caption: 'Didascalia modificata'
        },
        mockMediaItems[1]
      ];
      
      const updateData = {
        media: updatedMediaItems
      };
      
      const request = createMockRequest(updateData, { id: 'trip-123' });
      const response = await updateTripHandler(request, mockParams('trip-123'));
      
      // Verifica che l'aggiornamento sia avvenuto con successo
      expect(response.status).toBe(200);
      expect(prisma.trip.update).toHaveBeenCalled();
      
      // Verifica che l'update sia stato chiamato con la didascalia aggiornata
      const updateCall = (prisma.trip.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.media[0].caption).toBe('Didascalia modificata');
    });
  });
  
  describe('Creazione e aggiornamento con insights', () => {
    const tripWithInsights = {
      id: 'trip-456',
      title: 'Viaggio con insights',
      summary: 'Un viaggio con approfondimenti dettagliati',
      destination: 'Toscana',
      duration_days: 7,
      duration_nights: 6,
      tags: ['toscana', 'cultura', 'vino'],
      theme: 'Culturale',      characteristics: ['Città storiche', 'Strade panoramiche'],
      recommended_seasons: ['Primavera'],
      insights: 'La Toscana è una regione ricca di storia e cultura. Durante questo viaggio potrai visitare luoghi famosi come Firenze, Siena e San Gimignano, conoscere la loro storia e assaporare la cucina locale.',
      media: [],
      slug: 'viaggio-toscana-insights',
      status: 'Bozza',
      created_at: new Date(),
      updated_at: new Date(),
      user_id: 'user-123'
    };    beforeEach(() => {
      (prisma.trip.create as jest.Mock).mockImplementation(({ data }) => {
        return Promise.resolve({
          ...tripWithInsights,
          ...data,
          id: 'trip-456',
          slug: data.title ? data.title.toLowerCase().replace(/\s+/g, '-') : tripWithInsights.slug
        });
      });
      (prisma.trip.update as jest.Mock).mockImplementation(({ data }) => {
        return Promise.resolve({
          ...tripWithInsights,
          ...data
        });
      });
    });

    it('deve creare un viaggio con insights', async () => {
      const requestBody = {
        title: tripWithInsights.title,
        summary: tripWithInsights.summary,
        destination: tripWithInsights.destination,
        duration_days: tripWithInsights.duration_days,
        duration_nights: tripWithInsights.duration_nights,
        tags: tripWithInsights.tags,
        theme: tripWithInsights.theme,        characteristics: tripWithInsights.characteristics,
        recommended_seasons: tripWithInsights.recommended_seasons,
        insights: tripWithInsights.insights,
        media: []
      };

      (prisma.trip.findUnique as jest.Mock).mockResolvedValue(tripWithInsights);
      const request = createMockRequest(requestBody);
      const response = await createTripHandler(request);
      const body = await response.json();

      expect(prisma.trip.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            insights: tripWithInsights.insights,
            media: [],
            gpxFile: null
          })
        })
      );
      expect(response.status).toBe(201);
      expect(body).toEqual(expect.objectContaining({
        id: expect.any(String),
        insights: tripWithInsights.insights
      }));
    });

    it('deve aggiornare gli insights di un viaggio', async () => {
      const updatedInsights = 'Aggiornamento: La Toscana offre anche splendidi percorsi in moto attraverso le colline del Chianti, ideali per gli amanti delle due ruote.';
      
      const requestBody = {
        insights: updatedInsights
      };

      (prisma.trip.findUnique as jest.Mock).mockResolvedValue({
        ...tripWithInsights,
        insights: updatedInsights,
        user_id: 'user-123'
      });

      const request = createMockRequest(requestBody);
      const response = await updateTripHandler(request, mockParams('trip-456'));
      const body = await response.json();

      expect(prisma.trip.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            insights: updatedInsights
          })
        })
      );
      expect(response.status).toBe(200);
      expect(body.trip).toEqual(expect.objectContaining({
        insights: updatedInsights
      }));
    });
  });
});
