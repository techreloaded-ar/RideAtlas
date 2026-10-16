import React from 'react';
import { render, screen } from '@testing-library/react';
import { TripChips } from '@/components/trips/TripChips';

jest.mock('@/components/ui/SeasonIcon', () => ({
  SeasonIcon: () => <div />,
}));
jest.mock('lucide-react', () => ({
  Clock: () => <div />,
  MapPin: () => <div />,
  Mountain: () => <div />,
}));

describe('TripChips - mezzo', () => {
  const props = { duration: '3 giorni', location: 'Roma', terrain: 'Relax', seasons: [] };

  it('mostra il chip mezzo', () => {
    render(<TripChips {...props} vehicle="MONOPATTINO" />);
    expect(screen.getByTestId('trip-vehicle')).toHaveTextContent('Monopattino');
  });

  it('non mostra il chip senza mezzo', () => {
    render(<TripChips {...props} />);
    expect(screen.queryByTestId('trip-vehicle')).toBeNull();
  });
});
