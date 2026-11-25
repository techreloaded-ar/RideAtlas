import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookingPanel from '@/components/guided-trips/BookingPanel';
import SeatIndicator from '@/components/guided-trips/SeatIndicator';
import { summarizeSeats } from '@/lib/guided-trips/rules';

const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push: jest.fn() }) }));
jest.mock('@/components/payment/StripePaymentForm', () => ({
  __esModule: true,
  default: (props: { endpoints?: { createIntent: string } }) => <div data-testid="stripe-form">{props.endpoints?.createIntent}</div>,
}));

const base = { guidedTripId: 'gt-1', title: 'Dolomiti', price: 590, full: false, open: true, paymentMode: 'simulated' as const };

function mockFetch(...responses: { ok: boolean; body: unknown }[]) {
  const fn = jest.fn();
  for (const r of responses) fn.mockResolvedValueOnce({ ok: r.ok, json: async () => r.body });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe('BookingPanel', () => {
  beforeEach(() => refresh.mockClear());

  it('mostra la regola di annullamento e chiede l\'accesso a chi non è autenticato', () => {
    render(<BookingPanel {...base} viewer="anonymous" />);
    expect(screen.getByText(/Il pagamento conferma subito il posto/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Accedi per prenotare' })).toHaveAttribute('href', '/auth/signin?callbackUrl=%2Fguided-trips%2Fgt-1');
  });

  it('blocca la prenotazione per viaggio completo, organizzatore o prenotazioni chiuse', () => {
    const { rerender } = render(<BookingPanel {...base} full viewer="can-book" />);
    expect(screen.getByRole('button', { name: 'Posti esauriti' })).toBeDisabled();
    rerender(<BookingPanel {...base} viewer="organizer" />);
    expect(screen.getByText(/Sei l'organizzatore/)).toBeInTheDocument();
    rerender(<BookingPanel {...base} open={false} viewer="can-book" />);
    expect(screen.getByText(/prenotazioni per questo viaggio sono chiuse/)).toBeInTheDocument();
  });

  it('prenota con pagamento simulato e conferma il posto', async () => {
    const fetchMock = mockFetch(
      { ok: true, body: { bookingId: 'b-1', amount: 590, holdExpiresAt: '2027-01-10T12:15:00Z', paymentMode: 'simulated' } },
      { ok: true, body: { confirmed: true } },
    );
    render(<BookingPanel {...base} viewer="can-book" />);
    fireEvent.click(screen.getByRole('button', { name: /Prenota e paga il tuo posto/ }));
    expect(await screen.findByText('Pagamento simulato')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Paga/ }));
    expect(await screen.findByText('Il tuo posto è confermato')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/guided-trips/gt-1/bookings', { method: 'POST' });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/guided-trips/bookings/b-1/simulate', { method: 'POST' });
    expect(refresh).toHaveBeenCalled();
  });

  it('mostra «Posti esauriti» se l\'ultimo posto è stato preso nel frattempo', async () => {
    mockFetch({ ok: false, body: { error: 'Posti esauriti' } });
    render(<BookingPanel {...base} viewer="can-book" />);
    fireEvent.click(screen.getByRole('button', { name: /Prenota e paga il tuo posto/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Posti esauriti');
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it('usa gli endpoint delle prenotazioni con Stripe', async () => {
    mockFetch({ ok: true, body: { bookingId: 'b-9', amount: 590, holdExpiresAt: '2027-01-10T12:15:00Z', paymentMode: 'stripe' } });
    render(<BookingPanel {...base} paymentMode="stripe" viewer="can-book" />);
    fireEvent.click(screen.getByRole('button', { name: /Prenota e paga il tuo posto/ }));
    expect(await screen.findByTestId('stripe-form')).toHaveTextContent('/api/guided-trips/bookings/b-9/payment-intent');
  });

  it('mostra la conferma a chi ha già il posto', () => {
    render(<BookingPanel {...base} viewer="confirmed" />);
    expect(screen.getByText('Il tuo posto è confermato')).toBeInTheDocument();
  });
});

describe('SeatIndicator', () => {
  it('mostra etichetta, conteggio e barra', () => {
    render(<SeatIndicator seats={summarizeSeats(12, 10)} />);
    expect(screen.getByTestId('seat-badge')).toHaveTextContent('Ultimi 2 posti');
    expect(screen.getByText('10 su 12 prenotati')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10');
  });
});
