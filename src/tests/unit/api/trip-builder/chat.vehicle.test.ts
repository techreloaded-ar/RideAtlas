import { NextRequest } from 'next/server';
import { POST } from '@/app/api/trip-builder/chat/route';
import { auth } from '@/auth';

jest.mock('@/auth', () => ({ auth: jest.fn() }));

const mkTrip = (title: string, distance: number | null, days: number) => ({
  id: title,
  title,
  destination: 'Roma',
  duration_days: days,
  summary: 's',
  slug: title,
  theme: 't',
  characteristics: [],
  recommended_seasons: [],
  gpxData: distance === null ? { hasGpx: false } : { hasGpx: true, distance },
});
const trips = [
  mkTrip('Viaggio Alfa', 400000, 3),
  mkTrip('Viaggio Beta', 100000, 5),
  mkTrip('Viaggio Gamma', null, 2),
];

const req = (body: unknown) =>
  new NextRequest('http://localhost/api/trip-builder/chat', {
    method: 'POST',
    body: JSON.stringify(body),
  });

describe('POST /api/trip-builder/chat - mezzo', () => {
  let fetchMock: jest.Mock;
  beforeEach(() => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });
    fetchMock = jest.fn(async (url: string) => {
      if (String(url).includes('/api/trip-builder/trips')) {
        return { ok: true, json: async () => ({ trips }) };
      }
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'ok' } }] }) };
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  const openRouterBody = () => {
    const call = fetchMock.mock.calls.find((c) => String(c[0]).includes('openrouter'));
    return call![1].body as string;
  };

  it('applica i limiti del monopattino a prompt e filtro e restituisce il mezzo', async () => {
    const res = await POST(req({ vehicle: 'MONOPATTINO', message: '10 giorni' }));
    const data = await res.json();
    const body = openRouterBody();
    expect(res.status).toBe(200);
    expect(body).toContain('Monopattino');
    expect(body).toContain('50');
    expect(body).not.toContain('Viaggio Alfa');
    expect(body).toContain('Viaggio Beta');
    expect(data.vehicle).toBe('MONOPATTINO');
    expect(data.dailyKm.max).toBe(50);
  });

  it('senza vehicle usa MOTO', async () => {
    const res = await POST(req({ message: '10 giorni' }));
    const data = await res.json();
    expect(data.vehicle).toBe('MOTO');
    expect(openRouterBody()).toContain('Viaggio Alfa');
  });

  it('mezzo non valido restituisce 400 senza chiamare fetch', async () => {
    const res = await POST(req({ vehicle: 'AEREO', message: '10 giorni' }));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
