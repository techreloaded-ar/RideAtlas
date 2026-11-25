import { render, screen } from '@testing-library/react';
import type BookingPanelType from '@/components/guided-trips/BookingPanel';

// Regressione: senza chiave pubblica Stripe (anteprima locale) il modulo Stripe del browser
// lancia un errore al caricamento; la scheda del viaggio guidato non deve caricarlo.
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }) }));

delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BookingPanel: typeof BookingPanelType = require('@/components/guided-trips/BookingPanel').default;

describe('BookingPanel senza Stripe configurato', () => {
  it('si carica e mostra la prenotazione con pagamento simulato', () => {
    render(<BookingPanel guidedTripId="gt-1" title="Sardegna" price={740} full={false} open viewer="can-book" paymentMode="simulated" />);
    expect(screen.getByRole('button', { name: /Prenota e paga il tuo posto/ })).toBeInTheDocument();
  });
});
