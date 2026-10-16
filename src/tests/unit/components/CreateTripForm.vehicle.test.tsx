import { render, screen, fireEvent, waitFor } from '../../setup/test-utils';
import CreateTripForm from '@/components/trips/CreateTripForm';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/hooks/ui/useToast', () => ({
  useToast: () => ({ showSuccess: jest.fn(), showError: jest.fn() }),
}));
jest.mock('@/components/stages/SafeStageManager', () => ({ __esModule: true, default: () => null }));

const fetchMock = jest.fn();

const fillAndSubmit = async (vehicleLabel?: string) => {
  render(<CreateTripForm />);
  fireEvent.change(screen.getByLabelText('Titolo'), { target: { value: 'Giro in città' } });
  fireEvent.change(screen.getByLabelText('Descrizione'), { target: { value: 'Una descrizione abbastanza lunga' } });
  fireEvent.change(screen.getByLabelText('Destinazione/Area Geografica'), { target: { value: 'Milano' } });
  fireEvent.change(screen.getByLabelText('Tema'), { target: { value: 'Urbano' } });
  if (vehicleLabel) fireEvent.click(screen.getByRole('radio', { name: vehicleLabel }));
  fireEvent.click(screen.getByRole('button', { name: 'Crea Viaggio' }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const [url, init] = fetchMock.mock.calls[0];
  return { url, init, body: JSON.parse(init.body) };
};

describe('CreateTripForm - mezzo', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 't1', slug: 's' }),
    } as unknown as Response);
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('invia il mezzo Monopattino scelto', async () => {
    const { url, init, body } = await fillAndSubmit('Monopattino');
    expect(url).toBe('/api/trips');
    expect(init.method).toBe('POST');
    expect(body.vehicle).toBe('MONOPATTINO');
  });

  it('invia Moto se il mezzo non viene cambiato', async () => {
    const { body } = await fillAndSubmit();
    expect(body.vehicle).toBe('MOTO');
  });
});
