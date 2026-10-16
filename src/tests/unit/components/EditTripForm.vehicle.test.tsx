import { render, screen, fireEvent, waitFor } from '../../setup/test-utils';
import EditTripForm from '@/components/trips/EditTripForm';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/hooks/ui/useToast', () => ({
  useToast: () => ({ showSuccess: jest.fn(), showError: jest.fn() }),
}));
jest.mock('@/components/stages/SafeStageManager', () => ({ __esModule: true, default: () => null }));

const fetchMock = jest.fn();

const trip = (extra: Record<string, unknown>) => ({
  id: 't1',
  slug: 's',
  title: 'Viaggio salvato',
  summary: 'Descrizione del viaggio salvato',
  destination: 'Torino',
  theme: 'Città',
  characteristics: [],
  recommended_seasons: [],
  tags: [],
  media: [],
  gpxFile: null,
  stages: [{ id: 'st1', orderIndex: 0, title: 'Tappa 1', media: [], gpxFile: null }],
  ...extra,
});

const mockApi = (data: Record<string, unknown>) => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (_url: string, init?: { method?: string }) =>
    (init?.method === 'PUT'
      ? { ok: true, status: 200, json: async () => ({ trip: { slug: 's' } }) }
      : { ok: true, status: 200, json: async () => data }) as unknown as Response
  );
  global.fetch = fetchMock as unknown as typeof fetch;
};

describe('EditTripForm - mezzo', () => {
  it('ricarica il mezzo salvato e lo reinvia in PUT', async () => {
    mockApi(trip({ vehicle: 'EBIKE' }));
    render(<EditTripForm tripId="t1" />);
    await waitFor(() => expect((screen.getByRole('radio', { name: 'E-bike' }) as HTMLInputElement).checked).toBe(true));
    fireEvent.click(screen.getByRole('button', { name: 'Salva Modifiche' }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([, i]) => i?.method === 'PUT')).toBe(true));
    const [url, init] = fetchMock.mock.calls.find(([, i]) => i?.method === 'PUT')!;
    expect(url).toBe('/api/trips/t1');
    expect(JSON.parse(init.body).vehicle).toBe('EBIKE');
  });

  it('seleziona Moto se il viaggio non ha un mezzo', async () => {
    mockApi(trip({}));
    render(<EditTripForm tripId="t1" />);
    await waitFor(() => expect(screen.getByLabelText('Titolo')).toHaveValue('Viaggio salvato'));
    expect((screen.getByRole('radio', { name: 'Moto' }) as HTMLInputElement).checked).toBe(true);
  });
});
