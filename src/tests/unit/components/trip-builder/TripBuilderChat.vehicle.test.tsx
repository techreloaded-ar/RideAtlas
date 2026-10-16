import { render, screen, fireEvent, waitFor } from '../../../setup/test-utils';
import TripBuilderChat from '@/components/trip-builder/TripBuilderChat';

jest.mock('@/components/ui/MarkdownRenderer', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => <div>{content}</div>,
}));

const radio = (name: string) => screen.getByRole('radio', { name }) as HTMLInputElement;

describe('TripBuilderChat - mezzo', () => {
  let fetchMock: jest.Mock;
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({ message: 'ok', tripRecommendations: [], distanceWarnings: [] }),
    }));
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('mostra i 4 mezzi con Moto selezionato di default e permette di cambiare', () => {
    render(<TripBuilderChat />);
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(radio('Moto').checked).toBe(true);
    expect(radio('Bici')).toBeTruthy();
    expect(radio('E-bike')).toBeTruthy();
    fireEvent.click(radio('Monopattino'));
    expect(radio('Monopattino').checked).toBe(true);
    expect(radio('Moto').checked).toBe(false);
  });

  const send = async () => {
    fireEvent.change(screen.getByPlaceholderText(/Descrivi il tuo viaggio/), {
      target: { value: '5 giorni' },
    });
    fireEvent.click(screen.getAllByRole('button').slice(-1)[0]);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    return JSON.parse(fetchMock.mock.calls[0][1].body);
  };

  it('invia il mezzo scelto nel body', async () => {
    render(<TripBuilderChat />);
    fireEvent.click(radio('Monopattino'));
    expect((await send()).vehicle).toBe('MONOPATTINO');
  });

  it('invia MOTO se la selezione non cambia', async () => {
    render(<TripBuilderChat />);
    expect((await send()).vehicle).toBe('MOTO');
  });
});
