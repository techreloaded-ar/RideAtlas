import React from 'react';
import { render, screen } from '@testing-library/react';
import { TripDetailClient } from '@/components/trips/TripDetailClient';

jest.mock('next/link', () => {
  const MockLink = ({ children, href }: any) => <a href={href}>{children}</a>;
  return MockLink;
});
jest.mock('@/components/ui/UnifiedMediaGallery', () => ({ UnifiedMediaGallery: () => null }));
jest.mock('@/components/stages/StageTimeline', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/auth/AccessGate', () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
  AccessGate: ({ children }: any) => <>{children}</>,
}));
jest.mock('@/components/trips/PublishTripButton', () => ({ __esModule: true, default: () => null, PublishTripButton: () => null }));
jest.mock('@/components/trips/TripValidationWarning', () => ({ __esModule: true, default: () => null, TripValidationWarning: () => null }));
jest.mock('@/components/trips/TripMeta', () => ({ TripMeta: () => null }));

describe('TripDetailClient - mezzo', () => {
  it('indica il mezzo del viaggio', () => {
    const trip: any = {
      id: 't1',
      title: 'Viaggio',
      summary: 's',
      destination: 'Roma',
      duration_days: 2,
      theme: 'Relax',
      status: 'Pubblicato',
      price: 10,
      characteristics: [],
      tags: [],
      vehicle: 'MONOPATTINO',
      user: { id: 'u', name: 'N', email: 'e@test.com', role: 'Ranger' },
      stages: [],
    };
    render(
      <TripDetailClient
        trip={trip}
        isOwner={false}
        isSentinel={false}
        canEdit={false}
        tripMediaItems={[]}
        allStageMediaItems={[]}
        mappedSeasons={[]}
      />
    );
    expect(screen.getByTestId('trip-vehicle')).toHaveTextContent('Monopattino');
  });
});
