import {
  isMultiStageTripUtil,
  calculateTotalDistance,
  calculateTripDuration,
  validateStageOrder,
  reorderStages
} from '@/lib/trips/trip-utils';
import { Trip, Stage, TripStatus, RecommendedSeason } from '@/types/trip';

// Mock data per i test
const mockLegacyTrip: Trip = {
  id: 'trip-legacy-1',
  title: 'Viaggio Legacy',
  summary: 'Un viaggio tradizionale',
  destination: 'Roma',
  duration_days: 3,
  duration_nights: 2,
  tags: ['montagna'],
  theme: 'natura',
  characteristics: ['panoramico'],
  recommended_seasons: [RecommendedSeason.Primavera],
  media: [],
  gpxFile: {
    url: 'test.gpx',
    filename: 'test.gpx',
    waypoints: 100,
    distance: 15000, // 15km
    elevationGain: 500,
    elevationLoss: 400,
    isValid: true
  },
  insights: null,
  slug: 'viaggio-legacy',
  status: TripStatus.Pubblicato,
  created_at: new Date(),
  updated_at: new Date(),
  user_id: 'user-1'
};

const mockStage1: Stage = {
  id: 'stage-1',
  tripId: 'trip-multi-1',
  orderIndex: 0,
  title: 'Prima tappa',
  description: 'Descrizione prima tappa',
  routeType: 'Asfalto',
  media: [],
  gpxFile: {
    url: 'stage1.gpx',
    filename: 'stage1.gpx',
    waypoints: 50,
    distance: 8000, // 8km
    elevationGain: 200,
    elevationLoss: 150,
    isValid: true
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockStage2: Stage = {
  id: 'stage-2',
  tripId: 'trip-multi-1',
  orderIndex: 1,
  title: 'Seconda tappa',
  description: 'Descrizione seconda tappa',
  routeType: 'Sterrato',
  media: [],
  gpxFile: {
    url: 'stage2.gpx',
    filename: 'stage2.gpx',
    waypoints: 75,
    distance: 12000, // 12km
    elevationGain: 300,
    elevationLoss: 250,
    isValid: true
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockStage3: Stage = {
  id: 'stage-3',
  tripId: 'trip-multi-1',
  orderIndex: 2,
  title: 'Terza tappa',
  description: 'Descrizione terza tappa',
  routeType: 'Misto',
  media: [],
  gpxFile: null, // Tappa senza GPX
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockMultiStageTrip: Trip = {
  ...mockLegacyTrip,
  id: 'trip-multi-1',
  title: 'Viaggio Multi-Tappa',
  slug: 'viaggio-multi-tappa',
  stages: [mockStage1, mockStage2, mockStage3]
};

const mockEmptyStagesTrip: Trip = {
  ...mockLegacyTrip,
  id: 'trip-empty-stages',
  title: 'Viaggio con Stages Vuote',
  slug: 'viaggio-empty-stages',
  stages: []
};

describe('tripStageUtilities', () => {
  describe('isMultiStageTripUtil', () => {
    it('dovrebbe restituire true per viaggi con stages popolate', () => {
      expect(isMultiStageTripUtil(mockMultiStageTrip)).toBe(true);
    });

    it('dovrebbe restituire false per viaggi con stages vuote', () => {
      expect(isMultiStageTripUtil(mockEmptyStagesTrip)).toBe(false);
    });

    it('dovrebbe restituire false per viaggi legacy senza stages', () => {
      expect(isMultiStageTripUtil(mockLegacyTrip)).toBe(false);
    });

    it('dovrebbe restituire false per viaggi con stages undefined', () => {
      const tripWithUndefinedStages = { ...mockLegacyTrip, stages: undefined };
      expect(isMultiStageTripUtil(tripWithUndefinedStages)).toBe(false);
    });
  });

  describe('calculateTotalDistance', () => {
    describe('viaggi multi-tappa', () => {
      it('dovrebbe sommare le distanze di tutte le tappe con GPX', () => {
        const expected = 8000 + 12000; // mockStage1 + mockStage2 (mockStage3 ha GPX null)
        expect(calculateTotalDistance(mockMultiStageTrip)).toBe(expected);
      });

      it('dovrebbe utilizzare il GPX legacy per viaggi con stages vuote', () => {
        expect(calculateTotalDistance(mockEmptyStagesTrip)).toBe(15000); // usa il GPX legacy
      });

      it('dovrebbe gestire tappe senza GPX', () => {
        const tripWithNoGpxStages: Trip = {
          ...mockMultiStageTrip,
          stages: [
            { ...mockStage1, gpxFile: null },
            { ...mockStage2, gpxFile: null }
          ]
        };
        expect(calculateTotalDistance(tripWithNoGpxStages)).toBe(0);
      });

      it('dovrebbe gestire tappe con GPX senza distanza', () => {
        const tripWithNoDistanceGpx: Trip = {
          ...mockMultiStageTrip,
          stages: [
            { 
              ...mockStage1, 
              gpxFile: { ...mockStage1.gpxFile!, distance: 0 }
            }
          ]
        };
        expect(calculateTotalDistance(tripWithNoDistanceGpx)).toBe(0);
      });
    });

    describe('viaggi legacy', () => {
      it('dovrebbe utilizzare la distanza del GPX principale', () => {
        expect(calculateTotalDistance(mockLegacyTrip)).toBe(15000);
      });

      it('dovrebbe restituire 0 per viaggi senza GPX', () => {
        const tripWithoutGpx = { ...mockLegacyTrip, gpxFile: null };
        expect(calculateTotalDistance(tripWithoutGpx)).toBe(0);
      });

      it('dovrebbe restituire 0 per viaggi con GPX senza distanza', () => {
        const tripWithNoDistance = {
          ...mockLegacyTrip,
          gpxFile: { ...mockLegacyTrip.gpxFile!, distance: 0 }
        };
        expect(calculateTotalDistance(tripWithNoDistance)).toBe(0);
      });
    });
  });

  describe('calculateTripDuration', () => {
    describe('viaggi multi-tappa', () => {
      it('dovrebbe calcolare giorni basato sul numero di tappe', () => {
        const result = calculateTripDuration(mockMultiStageTrip);
        expect(result).toBe(3); // 3 stages
      });

      it('dovrebbe gestire viaggi con una sola tappa', () => {
        const singleStageTrip: Trip = {
          ...mockMultiStageTrip,
          stages: [mockStage1]
        };
        const result = calculateTripDuration(singleStageTrip);
        expect(result).toBe(1);
      });

      it('dovrebbe gestire viaggi con stages vuote', () => {
        const result = calculateTripDuration(mockEmptyStagesTrip);
        expect(result).toBe(3); // fallback a duration_days
      });
    });

    describe('viaggi legacy', () => {
      it('dovrebbe utilizzare duration_days esistente', () => {
        const result = calculateTripDuration(mockLegacyTrip);
        expect(result).toBe(3);
      });

      it('dovrebbe utilizzare 1 giorno di default se duration_days è null', () => {
        const tripWithNullDuration = { ...mockLegacyTrip, duration_days: null as any };
        const result = calculateTripDuration(tripWithNullDuration);
        expect(result).toBe(1);
      });

      it('dovrebbe gestire duration_days a 0', () => {
        const tripWithZeroDuration = { ...mockLegacyTrip, duration_days: 0 };
        const result = calculateTripDuration(tripWithZeroDuration);
        expect(result).toBe(1); // fallback a 1
      });
    });
  });

  describe('validateStageOrder', () => {
    it('dovrebbe validare ordinamento sequenziale corretto', () => {
      const orderedStages = [
        { ...mockStage1, orderIndex: 0 },
        { ...mockStage2, orderIndex: 1 },
        { ...mockStage3, orderIndex: 2 }
      ];
      expect(validateStageOrder(orderedStages)).toBe(true);
    });

    it('dovrebbe restituire true per array vuoto', () => {
      expect(validateStageOrder([])).toBe(true);
    });

    it('dovrebbe restituire true per array con un solo elemento', () => {
      const singleStage = [{ ...mockStage1, orderIndex: 0 }];
      expect(validateStageOrder(singleStage)).toBe(true);
    });

    it('dovrebbe invalidate ordinamento con gap negli indici', () => {
      const stagesWithGap = [
        { ...mockStage1, orderIndex: 0 },
        { ...mockStage2, orderIndex: 2 }, // gap: manca 1
        { ...mockStage3, orderIndex: 3 }
      ];
      expect(validateStageOrder(stagesWithGap)).toBe(false);
    });

    it('dovrebbe invalidare ordinamento con indici duplicati', () => {
      const stagesWithDuplicates = [
        { ...mockStage1, orderIndex: 0 },
        { ...mockStage2, orderIndex: 1 },
        { ...mockStage3, orderIndex: 1 } // duplicato
      ];
      expect(validateStageOrder(stagesWithDuplicates)).toBe(false);
    });

    it('dovrebbe invalidare ordinamento che non inizia da 0', () => {
      const stagesNotStartingFromZero = [
        { ...mockStage1, orderIndex: 1 },
        { ...mockStage2, orderIndex: 2 },
        { ...mockStage3, orderIndex: 3 }
      ];
      expect(validateStageOrder(stagesNotStartingFromZero)).toBe(false);
    });

    it('dovrebbe validare ordinamento mescolato ma sequenzialmente corretto', () => {
      const shuffledButValidStages = [
        { ...mockStage2, orderIndex: 1 },
        { ...mockStage3, orderIndex: 2 },
        { ...mockStage1, orderIndex: 0 } // non in ordine nell'array, ma orderIndex validi
      ];
      expect(validateStageOrder(shuffledButValidStages)).toBe(true);
    });

    it('dovrebbe gestire input null/undefined', () => {
      expect(validateStageOrder(null as any)).toBe(true);
      expect(validateStageOrder(undefined as any)).toBe(true);
    });
  });

  describe('reorderStages', () => {
    const testStages = [
      { ...mockStage1, orderIndex: 0 },
      { ...mockStage2, orderIndex: 1 },
      { ...mockStage3, orderIndex: 2 }
    ];

    it('dovrebbe riordinare correttamente le tappe', () => {
      const newOrder = [2, 0, 1]; // newOrder[i] = nuova posizione dell'elemento i
      const result = reorderStages(testStages, newOrder);
      
      expect(result).toHaveLength(3);
      // testStages[0] (mockStage1) va in posizione 2
      // testStages[1] (mockStage2) va in posizione 0  
      // testStages[2] (mockStage3) va in posizione 1
      expect(result[0]).toEqual({ ...mockStage2, orderIndex: 0 });
      expect(result[1]).toEqual({ ...mockStage3, orderIndex: 1 });
      expect(result[2]).toEqual({ ...mockStage1, orderIndex: 2 });
    });

    it('dovrebbe mantenere immutabilità degli oggetti originali', () => {
      const newOrder = [1, 0, 2];
      const result = reorderStages(testStages, newOrder);
      
      // Verifica che gli oggetti originali non siano stati modificati
      expect(testStages[0].orderIndex).toBe(0);
      expect(testStages[1].orderIndex).toBe(1);
      expect(testStages[2].orderIndex).toBe(2);
      
      // Verifica che il risultato sia diverso
      expect(result[0].orderIndex).toBe(0);
      expect(result[1].orderIndex).toBe(1);
      expect(result[2].orderIndex).toBe(2);
      
      // Ma con contenuti diversi
      expect(result[0].id).toBe(mockStage2.id);
      expect(result[1].id).toBe(mockStage1.id);
    });

    it('dovrebbe gestire array vuoti', () => {
      const result = reorderStages([], []);
      expect(result).toEqual([]);
    });

    it('dovrebbe lanciare errore per array di lunghezze diverse', () => {
      expect(() => {
        reorderStages(testStages, [0, 1]); // manca un elemento
      }).toThrow('Invalid input: stages and newOrder arrays must have the same length');
    });

    it('dovrebbe lanciare errore per newOrder con indici non consecutivi', () => {
      expect(() => {
        reorderStages(testStages, [0, 2, 3]); // gap: manca 1
      }).toThrow('Invalid newOrder: must contain consecutive indices starting from 0');
    });

    it('dovrebbe lanciare errore per newOrder con indici duplicati', () => {
      expect(() => {
        reorderStages(testStages, [0, 1, 1]); // duplicato
      }).toThrow('Invalid newOrder: must contain consecutive indices starting from 0');
    });

    it('dovrebbe lanciare errore per newOrder con indici fuori range', () => {
      expect(() => {
        reorderStages(testStages, [0, 1, 5]); // 5 è fuori range
      }).toThrow('Invalid newOrder: must contain consecutive indices starting from 0');
    });

    it('dovrebbe gestire input null/undefined', () => {
      expect(() => {
        reorderStages(null as any, [0, 1, 2]);
      }).toThrow('Invalid input: stages and newOrder arrays must have the same length');

      expect(() => {
        reorderStages(testStages, null as any);
      }).toThrow('Invalid input: stages and newOrder arrays must have the same length');
    });
  });
});