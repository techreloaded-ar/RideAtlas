import { render, screen, waitFor } from '../../setup/test-utils';
import userEvent from '@testing-library/user-event';
import ForgotPassword from '@/app/auth/forgot-password/page';

// Mock fetch globalmente
global.fetch = jest.fn();

describe('Forgot Password Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders forgot password form', () => {
    render(<ForgotPassword />);
    
    expect(screen.getByText('Password dimenticata?')).toBeInTheDocument();
    expect(screen.getByText(/inserisci la tua email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/indirizzo email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /invia link di reset/i })).toBeInTheDocument();
  });

  it('validates email format before submission', async () => {
    const user = userEvent.setup();
    
    render(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText(/indirizzo email/i);
    
    // Verifica che l'input abbia il tipo email per validazione HTML5
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');
    
    // Test che possiamo digitare un email valido
    await user.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('submits form with valid email', async () => {
    const user = userEvent.setup();
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Se l\'email esiste nel nostro sistema, riceverai un link per reimpostare la password.'
      })
    });
    
    render(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText(/indirizzo email/i);
    const submitButton = screen.getByRole('button', { name: /invia link di reset/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/riceverai un link/i)).toBeInTheDocument();
    });
    
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
  });

  it('shows error message on API failure', async () => {
    const user = userEvent.setup();
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Troppe richieste. Riprova tra un\'ora.'
      })
    });
    
    render(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText(/indirizzo email/i);
    const submitButton = screen.getByRole('button', { name: /invia link di reset/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/troppe richieste/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ message: 'Success' })
      }), 100))
    );
    
    render(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText(/indirizzo email/i);
    const submitButton = screen.getByRole('button', { name: /invia link di reset/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    // Check loading state
    expect(screen.getByText(/invio in corso/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });

  it('has correct navigation links', () => {
    render(<ForgotPassword />);
    
    const backToLoginLink = screen.getByText(/torna al login/i);
    expect(backToLoginLink.closest('a')).toHaveAttribute('href', '/auth/signin');
    
    const registerLink = screen.getByText(/registrati qui/i);
    expect(registerLink.closest('a')).toHaveAttribute('href', '/auth/register');
    
    const homeLink = screen.getByText(/rideatlas/i);
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('clears form after successful submission', async () => {
    const user = userEvent.setup();
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Email inviata'
      })
    });
    
    render(<ForgotPassword />);
    
    const emailInput = screen.getByLabelText(/indirizzo email/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /invia link di reset/i });
    
    await user.type(emailInput, 'test@example.com');
    expect(emailInput.value).toBe('test@example.com');
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email inviata/i)).toBeInTheDocument();
      expect(emailInput.value).toBe('');
    });
  });
});