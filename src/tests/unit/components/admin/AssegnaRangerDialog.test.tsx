import { render, screen, fireEvent, waitFor } from '@/tests/setup/test-utils'
import AssegnaRangerDialog from '@/components/admin/AssegnaRangerDialog'

// Mock di next/image
jest.mock('next/image', () => {
  const MockImage = (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  }
  MockImage.displayName = 'MockImage'
  return { __esModule: true, default: MockImage }
})

// Mock di lucide-react
jest.mock('lucide-react', () => {
  const UserPlus = ({ className, ...props }: any) => (
    <div data-testid="user-plus-icon" className={className} {...props} />
  )
  ;(UserPlus as any).displayName = 'UserPlus'

  const Search = ({ className, ...props }: any) => (
    <div data-testid="search-icon" className={className} {...props} />
  )
  ;(Search as any).displayName = 'Search'

  const User = ({ className, ...props }: any) => (
    <div data-testid="user-icon" className={className} {...props} />
  )
  ;(User as any).displayName = 'User'

  return { UserPlus, Search, User }
})

// Mock di fetch globale
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('AssegnaRangerDialog - Componente dialogo assegnazione ranger', () => {
  const mockViaggio = {
    id: 'trip-123',
    title: 'Viaggio nelle Alpi',
    user: {
      id: 'ranger-attuale-id',
      name: 'Mario Rossi',
      email: 'mario@rideatlas.com',
    },
  }

  const mockOnClose = jest.fn()
  const mockOnAssegnato = jest.fn()

  const defaultProps = {
    viaggio: mockViaggio,
    isOpen: true,
    onClose: mockOnClose,
    onAssegnato: mockOnAssegnato,
  }

  const mockRangersList = [
    {
      id: 'ranger-attuale-id',
      name: 'Mario Rossi',
      email: 'mario@rideatlas.com',
      image: null,
      role: 'Ranger',
    },
    {
      id: 'ranger-2',
      name: 'Anna Bianchi',
      email: 'anna@rideatlas.com',
      image: null,
      role: 'Ranger',
    },
    {
      id: 'sentinel-1',
      name: 'Carlo Verdi',
      email: 'carlo@rideatlas.com',
      image: 'https://example.com/avatar.jpg',
      role: 'Sentinel',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ rangers: mockRangersList }),
    })
  })

  describe('Rendering condizionale', () => {
    it('Non renderizza nulla quando isOpen è false', () => {
      const { container } = render(
        <AssegnaRangerDialog
          {...defaultProps}
          isOpen={false}
        />
      )

      expect(container.innerHTML).toBe('')
    })

    it('Non renderizza nulla quando viaggio è null', () => {
      const { container } = render(
        <AssegnaRangerDialog
          {...defaultProps}
          viaggio={null}
        />
      )

      expect(container.innerHTML).toBe('')
    })
  })

  describe('Rendering quando aperto', () => {
    it('Mostra titolo e info viaggio quando aperto', async () => {
      render(<AssegnaRangerDialog {...defaultProps} />)

      expect(screen.getByText('Assegna Ranger')).toBeInTheDocument()
      // Il titolo del viaggio è incluso nel testo con virgolette
      expect(screen.getByText(/Viaggio nelle Alpi/)).toBeInTheDocument()
    })

    it('Carica e mostra la lista dei rangers', async () => {
      render(<AssegnaRangerDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
        expect(screen.getByText('Anna Bianchi')).toBeInTheDocument()
        expect(screen.getByText('Carlo Verdi')).toBeInTheDocument()
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/rangers', expect.objectContaining({ signal: expect.any(AbortSignal) }))
    })

    it('Evidenzia il ranger attuale con badge "(Attuale)"', async () => {
      render(<AssegnaRangerDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('(Attuale)')).toBeInTheDocument()
      })

      // Verifica che ci sia un solo badge "(Attuale)"
      const badgeElements = screen.getAllByText('(Attuale)')
      expect(badgeElements).toHaveLength(1)
    })
  })

  describe('Funzionalità di ricerca', () => {
    it('Filtra i rangers tramite campo di ricerca', async () => {
      render(<AssegnaRangerDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Cerca per nome o email...')
      fireEvent.change(searchInput, { target: { value: 'Anna' } })

      expect(screen.getByText('Anna Bianchi')).toBeInTheDocument()
      expect(screen.queryByText('Mario Rossi')).not.toBeInTheDocument()
      expect(screen.queryByText('Carlo Verdi')).not.toBeInTheDocument()
    })

    it('Filtra per email', async () => {
      render(<AssegnaRangerDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Cerca per nome o email...')
      fireEvent.change(searchInput, { target: { value: 'carlo@' } })

      expect(screen.getByText('Carlo Verdi')).toBeInTheDocument()
      expect(screen.queryByText('Mario Rossi')).not.toBeInTheDocument()
    })
  })

  describe('Stato pulsante conferma', () => {
    it('Disabilita il pulsante conferma se nessun ranger selezionato', async () => {
      render(<AssegnaRangerDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      const confirmButton = screen.getByText('Conferma Assegnazione')
      expect(confirmButton).toBeDisabled()
    })

    it('Disabilita il pulsante conferma se selezionato il ranger attuale', async () => {
      render(<AssegnaRangerDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Mario Rossi')).toBeInTheDocument()
      })

      // Clicca sul ranger attuale (Mario Rossi)
      const rangerAttualeButton = screen.getByText('Mario Rossi').closest('button')!
      fireEvent.click(rangerAttualeButton)

      const confirmButton = screen.getByText('Conferma Assegnazione')
      expect(confirmButton).toBeDisabled()
    })

    it('Abilita il pulsante conferma se selezionato un ranger diverso', async () => {
      render(<AssegnaRangerDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Anna Bianchi')).toBeInTheDocument()
      })

      // Clicca su un ranger diverso
      const nuovoRangerButton = screen.getByText('Anna Bianchi').closest('button')!
      fireEvent.click(nuovoRangerButton)

      const confirmButton = screen.getByText('Conferma Assegnazione')
      expect(confirmButton).not.toBeDisabled()
    })
  })

  describe('Azioni utente', () => {
    it('Chiama onClose quando si clicca Annulla', async () => {
      render(<AssegnaRangerDialog {...defaultProps} />)

      const cancelButton = screen.getByText('Annulla')
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('Chiama l\'API e onAssegnato quando si conferma l\'assegnazione', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rangers: mockRangersList }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'trip-123',
            user_id: 'ranger-2',
            user: mockRangersList[1],
          }),
        })

      render(<AssegnaRangerDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Anna Bianchi')).toBeInTheDocument()
      })

      // Seleziona un nuovo ranger
      const nuovoRangerButton = screen.getByText('Anna Bianchi').closest('button')!
      fireEvent.click(nuovoRangerButton)

      // Conferma l'assegnazione
      const confirmButton = screen.getByText('Conferma Assegnazione')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/trips/trip-123/assign', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rangerId: 'ranger-2' }),
        })
        expect(mockOnAssegnato).toHaveBeenCalledTimes(1)
      })
      // Dopo il fix C3, onClose NON viene più chiamato dopo l'assegnazione
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Gestione errori', () => {
    it('Mostra errore se la chiamata API per caricare i rangers fallisce', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Errore nel caricamento dei rangers' }),
      })

      render(<AssegnaRangerDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Errore nel caricamento dei rangers')).toBeInTheDocument()
      })
    })

    it('Mostra errore se la chiamata API di assegnazione fallisce', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rangers: mockRangersList }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Errore nell\'assegnazione del ranger' }),
        })

      render(<AssegnaRangerDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Anna Bianchi')).toBeInTheDocument()
      })

      // Seleziona un nuovo ranger
      const nuovoRangerButton = screen.getByText('Anna Bianchi').closest('button')!
      fireEvent.click(nuovoRangerButton)

      // Conferma l'assegnazione
      const confirmButton = screen.getByText('Conferma Assegnazione')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText("Errore nell'assegnazione del ranger")).toBeInTheDocument()
      })
    })
  })
})
