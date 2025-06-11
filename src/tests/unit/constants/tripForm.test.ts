// src/tests/unit/constants/tripForm.test.ts
import { characteristicOptions } from '@/constants/tripForm';

describe('TripForm Constants', () => {
  describe('characteristicOptions', () => {
    it('shouldContainAllRequiredPositiveCharacteristics', () => {
      const expectedCharacteristics = [
        'Strade sterrate',
        'Curve strette',
        'Presenza pedaggi',
        'Presenza traghetti',
        'Autostrada',
        'Bel paesaggio',
        'Visita prolungata',
        'Interesse gastronomico',
        'Interesse storico-culturale'
      ];

      expect(characteristicOptions).toEqual(expectedCharacteristics);
    });

    it('shouldNotContainNegativeFormulations', () => {
      const negativeFormulations = [
        'Evita pedaggi',
        'Evita traghetti'
      ];

      negativeFormulations.forEach(negative => {
        expect(characteristicOptions).not.toContain(negative);
      });
    });

    it('shouldContainNewGastronomyAndCulturalOptions', () => {
      const newOptions = [
        'Visita prolungata',
        'Interesse gastronomico', 
        'Interesse storico-culturale'
      ];

      newOptions.forEach(option => {
        expect(characteristicOptions).toContain(option);
      });
    });

    it('shouldMaintainCorrectArrayLength', () => {
      // 6 caratteristiche originali + 3 nuove = 9 totali
      expect(characteristicOptions).toHaveLength(9);
    });

    it('shouldHaveUniqueCharacteristics', () => {
      const uniqueOptions = [...new Set(characteristicOptions)];
      expect(uniqueOptions).toHaveLength(characteristicOptions.length);
    });
  });
});
