import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import GuidedTripsAgenda from '@/components/guided-trips/GuidedTripsAgenda';
import GuidedTripBookingPanel from '@/components/guided-trips/GuidedTripBookingPanel';
import type { GuidedTripDetail, GuidedTripListItem } from '@/types/guided-trip';

const push = jest.fn();
const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));
jest.mock('next/dynamic', () => () => function StripePaymentFormStub() { return <div>Modulo carta Stripe</div>; });

const listItem = (overrides: Partial<GuidedTripListItem>): GuidedTripListItem => ({
  id: 'gt-1',
  title: 'Dolomiti in gruppo',
  startDate: '2027-06-12T00:00:00.000Z',
  endDate: '2027-06-15T00:00:00.000Z',
  meetingPoint: 'Bolzano',
  pricePerPerson: 450,
  maxParticipants: 8,
  remainingSeats: 3,
  organizerName: 'Giulia',
  ...overrides,
});

describe('GuidedTripsAgenda', () => {
  it('raggruppa per mese e mostra posti rimasti, prezzo ed esaurito', () => {
    render(
      <GuidedTripsAgenda
        guidedTrips={[
          listItem({}),
          listItem({ id: 'gt-2', title: 'Costa dei Trabocchi', startDate: '2027-06-20T00:00:00.000Z', endDate: '2027-06-22T00:00:00.000Z', remainingSeats: 0, maxParticipants: 12, pricePerPerson: 320 }),
          listItem({ id: 'gt-3', title: 'Passi svizzeri', startDate: '2027-07-24T00:00:00.000Z', endDate: '2027-07-27T00:00:00.000Z', remainingSeats: 1 }),
        ]}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Giugno 2027' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Luglio 2027' })).toBeInTheDocument();
    expect(screen.getByText('3 posti rimasti su 8')).toBeInTheDocument();
    expect(screen.getByText('Ultimo posto su 8')).toBeInTheDocument();

    const soldOutRow = screen.getByText('Costa dei Trabocchi').closest('li') as HTMLElement;
    expect(within(soldOutRow).getAllByText('Esaurito').length).toBeGreaterThan(0);
    expect(within(soldOutRow).queryByRole('link', { name: 'Prenota' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Filtra per mese'), { target: { value: '2027-07' } });
    expect(screen.queryByText('Dolomiti in gruppo')).not.toBeInTheDocument();
    expect(screen.getByText('Passi svizzeri')).toBeInTheDocument();
  });

  it('spiega quando non ci sono viaggi in programma', () => {
    render(<GuidedTripsAgenda guidedTrips={[]} />);
    expect(screen.getByText('Nessun viaggio guidato in programma')).toBeInTheDocument();
  });
});

const detail = (overrides: Partial<GuidedTripDetail> = {}): GuidedTripDetail => ({
  ...listItem({}),
  description: 'Quattro giorni sui passi',
  status: 'Pubblicato',
  cancellationReason: null,
  organizerId: 'ranger-1',
  linkedTrip: null,
  linkedTripId: null,
  participantCancellationDeadline: '2027-05-29T00:00:00.000Z',
  bookable: true,
  viewerIsOrganizer: false,
  viewerCanManage: false,
  viewerHasConfirmedBooking: false,
  ...overrides,
});

describe('GuidedTripBookingPanel', () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('mostra la regola di disdetta prima del pagamento e chiede l\'accesso a chi non è autenticato', () => {
    render(<GuidedTripBookingPanel guidedTrip={detail()} isLoggedIn={false} paymentMode="simulated" />);
    expect(screen.getByText(/puoi disdire con rimborso totale fino al/)).toHaveTextContent('29 maggio 2027');
    expect(screen.getByRole('link', { name: 'Accedi per prenotare' })).toHaveAttribute('href', '/auth/signin');
  });

  it('riserva il posto, paga in modalità simulata e porta alle prenotazioni', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ booking: { id: 'b-1', amount: 450, seatHeldUntil: '2027-05-20T10:15:00.000Z' }, paymentMode: 'simulated' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ confirmed: true }) });

    render(<GuidedTripBookingPanel guidedTrip={detail()} isLoggedIn paymentMode="simulated" />);
    fireEvent.click(screen.getByRole('button', { name: 'Prenota il tuo posto' }));
    const payButton = await screen.findByRole('button', { name: /Paga 450\s€ \(simulato\)/ });
    expect(screen.getByText(/il pagamento è simulato/)).toBeInTheDocument();
    fireEvent.click(payButton);

    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard/guided-trips?tab=bookings&booked=b-1'));
    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/guided-trips/gt-1/bookings', { method: 'POST' });
    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/guided-trips/bookings/b-1/simulated-payment', { method: 'POST' });
  });

  it('mostra l\'errore se i posti finiscono mentre si prenota', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Posti esauriti' }) });
    render(<GuidedTripBookingPanel guidedTrip={detail({ remainingSeats: 1 })} isLoggedIn paymentMode="simulated" />);
    fireEvent.click(screen.getByRole('button', { name: 'Prenota il tuo posto' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Posti esauriti');
  });

  it('non offre la prenotazione su un viaggio esaurito, proprio o già prenotato', () => {
    const { rerender } = render(<GuidedTripBookingPanel guidedTrip={detail({ remainingSeats: 0 })} isLoggedIn paymentMode="simulated" />);
    expect(screen.queryByRole('button', { name: 'Prenota il tuo posto' })).not.toBeInTheDocument();
    expect(screen.getAllByText('Esaurito').length).toBeGreaterThan(0);

    rerender(<GuidedTripBookingPanel guidedTrip={detail({ viewerIsOrganizer: true })} isLoggedIn paymentMode="simulated" />);
    expect(screen.getByText(/Sei l'organizzatore/)).toBeInTheDocument();

    rerender(<GuidedTripBookingPanel guidedTrip={detail({ viewerHasConfirmedBooking: true })} isLoggedIn paymentMode="simulated" />);
    expect(screen.getByText(/Hai già un posto/)).toBeInTheDocument();
  });

  it('con Stripe configurato mostra il modulo carta', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ booking: { id: 'b-1', amount: 450, seatHeldUntil: '2027-05-20T10:15:00.000Z' }, paymentMode: 'stripe' }) });
    render(<GuidedTripBookingPanel guidedTrip={detail()} isLoggedIn paymentMode="stripe" />);
    fireEvent.click(screen.getByRole('button', { name: 'Prenota il tuo posto' }));
    expect(await screen.findByText('Modulo carta Stripe')).toBeInTheDocument();
  });
});
