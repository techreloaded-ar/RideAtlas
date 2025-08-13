import { render, screen, waitFor } from '../../setup/test-utils';
import userEvent from '@testing-library/user-event';
import ResetPassword from '@/app/auth/reset-password/page';

// Mock fetch globalmente
global.fetch = jest.fn();

// Mock useSearchParams e useRouter
const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet
  }),
  useRouter: () => ({
    push: mockPush
  })
}));

describe('Reset Password Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mocks to default state
    mockGet.mockReset();
    mockPush.mockReset();
    (global.fetch as jest.Mock).mockReset();
    
    // Set default token
    mockGet.mockReturnValue('valid-token-123');
  });

  it('shows loading state during token validation', () => {
    // Mock pending fetch
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    );
    
    render(<ResetPassword />);
    
    expect(screen.getByText(/validazione token/i)).toBeInTheDocument();
  });

  it('shows error for invalid token', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Token non valido o scaduto'
      })
    });
    
    render(<ResetPassword />);
    
    await waitFor(() => {
      expect(screen.getByText(/link non valido/i)).toBeInTheDocument();
      expect(screen.getByText(/token non valido o scaduto/i)).toBeInTheDocument();
    });
  });

  it('shows error when no token provided', async () => {
    mockGet.mockReturnValue(null);
    
    render(<ResetPassword />);
    
    await waitFor(() => {
      expect(screen.getByText(/link non valido/i)).toBeInTheDocument();
      expect(screen.getByText(/token mancante/i)).toBeInTheDocument();
    });
  });

  it('renders reset form for valid token', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: true,
        email: 'test@example.com'
      })
    });
    
    render(<ResetPassword />);
    
    await waitFor(() => {
      expect(screen.getByText(/imposta nuova password/i)).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
      expect(screen.getByLabelText(/nuova password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/conferma password/i)).toBeInTheDocument();
    });
  });

  it('shows password requirements', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: true,
        email: 'test@example.com'
      })
    });
    
    render(<ResetPassword />);
    
    await waitFor(() => {
      expect(screen.getByText(/requisiti password/i)).toBeInTheDocument();
      expect(screen.getByText(/almeno 8 caratteri/i)).toBeInTheDocument();
      expect(screen.getByText(/almeno una lettera maiuscola/i)).toBeInTheDocument();
      expect(screen.getByText(/almeno una lettera minuscola/i)).toBeInTheDocument();
      expect(screen.getByText(/almeno un numero/i)).toBeInTheDocument();
    });
  });

  it('validates password mismatch', async () => {
    const user = userEvent.setup();
    
    // Mock valid token
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: true,
        email: 'test@example.com'
      })
    });
    
    render(<ResetPassword />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/nuova password/i)).toBeInTheDocument();
    });
    
    const passwordInput = screen.getByLabelText(/nuova password/i);
    const confirmInput = screen.getByLabelText(/conferma password/i);
    const submitButton = screen.getByRole('button', { name: /aggiorna password/i });
    
    await user.type(passwordInput, 'ValidPass123');
    await user.type(confirmInput, 'DifferentPass456');
    
    // Mock validation error response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Le password non coincidono'
      })
    });
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/le password non coincidono/i)).toBeInTheDocument();
    });
  });

  it('renders component with token', async () => {
    // Ensure token is provided
    mockGet.mockReturnValue('valid-token-123');
    
    // Mock valid token response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: true,
        email: 'test@example.com'
      })
    });
    
    render(<ResetPassword />);
    
    // First, check that loading state appears
    expect(screen.getByText(/validazione token/i)).toBeInTheDocument();
    
    // Then wait for either form or error to appear
    await waitFor(() => {
      // Should show either the form or an error, not loading
      expect(screen.queryByText(/validazione token/i)).not.toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Check that fetch was called with the token
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/reset-password?token=valid-token-123');
  });

  it('shows form elements correctly', async () => {
    // Mock valid token
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: true,
        email: 'test@example.com'
      })
    });
    
    render(<ResetPassword />);
    
    await waitFor(() => {
      expect(screen.getByText(/imposta nuova password/i)).toBeInTheDocument();
    });
    
    // Check that password requirements are shown
    expect(screen.getByText(/requisiti password/i)).toBeInTheDocument();
    expect(screen.getByText(/almeno 8 caratteri/i)).toBeInTheDocument();
    
    // Check form inputs
    const passwordInput = screen.getByLabelText(/nuova password/i);
    const confirmInput = screen.getByLabelText(/conferma password/i);
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmInput).toHaveAttribute('type', 'password');
  });

  it('handles missing token', async () => {
    // No token provided
    mockGet.mockReturnValue(null);
    
    render(<ResetPassword />);
    
    // Should show error immediately for missing token
    await waitFor(() => {
      expect(screen.getByText(/token mancante/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Should not call fetch if no token
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('has correct navigation links for valid form', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: true,
        email: 'test@example.com'
      })
    });
    
    render(<ResetPassword />);
    
    await waitFor(() => {
      const loginLinkElement = screen.getByText(/torna al login/i);
      expect(loginLinkElement.closest('a')).toHaveAttribute('href', '/auth/signin');
      
      const homeLinkElement = screen.getByText(/rideatlas/i);
      expect(homeLinkElement.closest('a')).toHaveAttribute('href', '/');
    });
  });
});