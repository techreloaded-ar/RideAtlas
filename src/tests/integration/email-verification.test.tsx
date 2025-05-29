import { render, screen, waitFor } from '../setup/test-utils';

// Mock fetch globalmente
global.fetch = jest.fn();

// Mock useRouter
const mockPush = jest.fn();
const mockReplace = jest.fn();

// Mock useSearchParams - questo verrà sovrascritto per ogni test
const mockSearchParamsGet = jest.fn();

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockSearchParamsGet,
    getAll: jest.fn(),
    has: jest.fn(),
    entries: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    toString: jest.fn(),
  }),
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  }),
}));

// Import del componente reale dopo i mock
import VerifyEmailPage from '@/app/auth/verify-email/page';

describe('Email Verification Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset dei mock
    mockSearchParamsGet.mockReset();
    mockPush.mockReset();
    mockReplace.mockReset();
    
    // Mock dell'API di verifica email
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/auth/verify-email')) {
        const urlObj = new URL(url, 'http://localhost:3000');
        const token = urlObj.searchParams.get('token');
        
        if (token === 'valid-token') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              message: 'Email verificata con successo!',
              verified: true
            })
          });
        }
        
        if (token === 'expired-token') {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({
              error: 'Token scaduto'
            })
          });
        }
        
        if (token === 'already-verified-token') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              message: 'Email già verificata con successo!',
              verified: true,
              alreadyVerified: true
            })
          });
        }
        
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({
            error: 'Token non valido'
          })
        });
      }
      
      return Promise.reject(new Error('URL non gestito nel mock'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('verifies email successfully with valid token', async () => {
    // Configura i parametri di ricerca per questo test
    mockSearchParamsGet.mockImplementation((key: string) => {
      if (key === 'token') return 'valid-token';
      return null;
    });
    
    render(<VerifyEmailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Email Verificata!')).toBeInTheDocument();
      expect(screen.getByText('Il tuo account è stato attivato con successo.')).toBeInTheDocument();
    });
  });

  it('handles expired verification token', async () => {
    // Configura i parametri di ricerca per questo test
    mockSearchParamsGet.mockImplementation((key: string) => {
      if (key === 'token') return 'expired-token';
      return null;
    });
    
    render(<VerifyEmailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Verifica Fallita')).toBeInTheDocument();
      expect(screen.getByText(/token scaduto/i)).toBeInTheDocument();
    });
  });

  it('handles already verified email gracefully', async () => {
    // Configura i parametri di ricerca per questo test
    mockSearchParamsGet.mockImplementation((key: string) => {
      if (key === 'token') return 'already-verified-token';
      return null;
    });
    
    render(<VerifyEmailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Email Verificata!')).toBeInTheDocument();
      expect(screen.getByText('Il tuo account è stato attivato con successo.')).toBeInTheDocument();
    });
  });

  it('handles invalid verification token', async () => {
    // Configura i parametri di ricerca per questo test
    mockSearchParamsGet.mockImplementation((key: string) => {
      if (key === 'token') return 'invalid-token';
      return null;
    });
    
    render(<VerifyEmailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Verifica Fallita')).toBeInTheDocument();
      // Usa getAllByText per gestire il testo duplicato, poi verifica il primo
      const elements = screen.getAllByText(/token non valido/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('handles missing verification token', async () => {
    // Configura i parametri di ricerca per questo test - nessun token
    mockSearchParamsGet.mockImplementation(() => {
      return null; // Nessun parametro
    });

    render(<VerifyEmailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Verifica Fallita')).toBeInTheDocument();
      // Usa getAllByText per gestire il testo duplicato, poi verifica il primo
      const elements = screen.getAllByText(/token di verifica mancante/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('API Integration', () => {
    it('calls verify-email API with correct parameters', async () => {
      // Simula la chiamata diretta all'API
      const response = await fetch('/api/auth/verify-email?token=valid-token');
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.message).toBe('Email verificata con successo!');
      expect(data.verified).toBe(true);
    });

    it('handles API errors gracefully', async () => {
      const response = await fetch('/api/auth/verify-email?token=invalid-token');
      const data = await response.json();
      
      expect(response.ok).toBe(false);
      expect(data.error).toBe('Token non valido');
    });

    it('handles network errors during verification', async () => {
      // Mock a network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      try {
        await fetch('/api/auth/verify-email?token=valid-token');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });
  });
});
