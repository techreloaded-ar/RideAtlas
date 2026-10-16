import React from 'react';
import { render, screen } from '@testing-library/react';
import TripsPage from '@/app/trips/page';

jest.mock('@/lib/core/prisma', () => ({
  prisma: { trip: { findMany: jest.fn().mockResolvedValue([]) } },
}));
jest.mock('@/auth', () => ({ auth: jest.fn().mockResolvedValue(null) }));
jest.mock('@/app/trips/TripsPageClient', () => ({
  __esModule: true,
  default: () => <div data-testid="trips-client" />,
}));

describe('Trips page subtitle', () => {
  it('shows the inclusive subtitle in a paragraph after the title', async () => {
    const ui = await TripsPage();
    render(ui);
    const subtitle = screen.getByText('Scopri tutti gli itinerari in moto e bici');
    expect(subtitle.tagName).toBe('P');
    const h1 = screen.getByRole('heading', { name: 'Tutti i Viaggi' });
    expect(h1.compareDocumentPosition(subtitle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(h1.parentElement).toBe(subtitle.parentElement);
  });

  it('no longer shows the old subtitle', async () => {
    const ui = await TripsPage();
    const { container } = render(ui);
    expect(screen.queryByText(/community di motociclisti appassionati/)).toBeNull();
    expect(container.textContent).not.toContain('motociclisti appassionati');
  });

  it('keeps the rest of the page intact', async () => {
    const ui = await TripsPage();
    render(ui);
    expect(screen.getByRole('heading', { name: 'Tutti i Viaggi' })).toBeTruthy();
    expect(screen.getAllByTestId('trips-client')).toHaveLength(1);
  });
});
