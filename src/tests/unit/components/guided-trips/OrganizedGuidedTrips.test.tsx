import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OrganizedGuidedTrips from '@/components/guided-trips/OrganizedGuidedTrips'

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'ranger-1', role: 'Ranger' } }, status: 'authenticated' }),
}))

const guidedTrip = (overrides: Record<string, unknown>) => ({
  id: 'gt-1',
  slug: 'dolomiti',
  title: 'Dolomiti, passi e rifugi',
  meetingPoint: 'Bassano, piazza Libertà',
  departureDate: '2027-06-14T00:00:00.000Z',
  returnDate: '2027-06-16T00:00:00.000Z',
  maxParticipants: 8,
  pricePerParticipant: 450,
  status: 'Pubblicato',
  displayStatus: 'Pubblicato',
  seats: { confirmedParticipants: 3 },
  ...overrides,
})

function mockFetch(responses: Array<{ ok: boolean; body: unknown }>) {
  const fetchMock = jest.fn()
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce({ ok: response.ok, json: async () => response.body })
  }
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

describe('OrganizedGuidedTrips (sezione dashboard come «I Tuoi Viaggi»)', () => {
  it('mostra conteggio, pulsante «Nuovo Viaggio Guidato» ed elenco con stato, date e iscritti', async () => {
    mockFetch([{ ok: true, body: { guidedTrips: [guidedTrip({}), guidedTrip({ id: 'gt-2', slug: 'langhe', title: 'Langhe', status: 'Bozza', displayStatus: 'Bozza', seats: { confirmedParticipants: 0 } })] } }])

    render(<OrganizedGuidedTrips />)

    expect(await screen.findByText('I Tuoi Viaggi Guidati')).toBeInTheDocument()
    expect(screen.getByText('2 viaggi guidati')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Nuovo Viaggio Guidato/ })).toHaveAttribute('href', '/dashboard/guided-trips/new')
    expect(screen.getAllByText('14 – 16 giugno 2027', { selector: 'div' })).toHaveLength(2)
    expect(screen.getByText('3/8 iscritti')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Visualizza Dolomiti, passi e rifugi' })).toHaveAttribute('href', '/guided-trips/dolomiti')
    expect(screen.getByRole('link', { name: 'Modifica Dolomiti, passi e rifugi' })).toHaveAttribute('href', '/dashboard/guided-trips/gt-1')
    // Pubblica solo per le bozze, come nella sezione dei viaggi.
    expect(screen.queryByRole('button', { name: 'Pubblica Dolomiti, passi e rifugi' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pubblica Langhe' })).toBeInTheDocument()
  })

  it('pubblica una bozza dall\'icona e ricarica l\'elenco', async () => {
    const fetchMock = mockFetch([
      { ok: true, body: { guidedTrips: [guidedTrip({ status: 'Bozza', displayStatus: 'Bozza' })] } },
      { ok: true, body: { success: true } },
      { ok: true, body: { guidedTrips: [guidedTrip({})] } },
    ])

    render(<OrganizedGuidedTrips />)
    fireEvent.click(await screen.findByRole('button', { name: 'Pubblica Dolomiti, passi e rifugi' }))

    await waitFor(() => expect(screen.queryByRole('button', { name: /Pubblica/ })).not.toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith('/api/guided-trips/gt-1/publish', { method: 'POST' })
    expect(screen.getByText('1 viaggio guidato')).toBeInTheDocument()
  })

  it('senza viaggi invita a creare il primo viaggio guidato', async () => {
    mockFetch([{ ok: true, body: { guidedTrips: [] } }])
    render(<OrganizedGuidedTrips />)
    expect(await screen.findByText('Nessun viaggio guidato creato')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Crea il tuo primo viaggio guidato/ })).toHaveAttribute('href', '/dashboard/guided-trips/new')
  })
})
