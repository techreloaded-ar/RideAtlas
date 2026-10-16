import { transformApiDataToFormData, transformTripDataForSubmission } from '@/lib/trips/trip-submission';
import type { TripWithStagesData } from '@/schemas/trip';

describe('trip-submission - vehicle', () => {
  it('ricarica il mezzo salvato', () => {
    expect(transformApiDataToFormData({ title: 't', vehicle: 'BICI' }).vehicle).toBe('BICI');
  });

  it('usa MOTO se il mezzo manca', () => {
    expect(transformApiDataToFormData({ title: 't' }).vehicle).toBe('MOTO');
  });

  it('usa MOTO se il mezzo non e valido', () => {
    expect(transformApiDataToFormData({ title: 't', vehicle: 'XYZ' }).vehicle).toBe('MOTO');
  });

  it('conserva il mezzo nel payload di invio', () => {
    const data = {
      title: 'Viaggio',
      summary: 'Descrizione del viaggio',
      destination: 'D',
      theme: 'T',
      vehicle: 'MONOPATTINO',
      characteristics: [],
      recommended_seasons: [],
      tags: [],
      media: [],
      gpxFile: null,
      stages: [],
    } as unknown as TripWithStagesData;
    expect(transformTripDataForSubmission(data).vehicle).toBe('MONOPATTINO');
  });
});
