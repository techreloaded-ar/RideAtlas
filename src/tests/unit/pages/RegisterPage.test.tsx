import { render, screen, waitFor } from '../../setup/test-utils';
import userEvent from '@testing-library/user-event';
import Register from '@/app/auth/register/page';

describe('RegisterPage', () => {
  beforeEach(() => {
    // Mock fetch globalmente per ogni test
    global.fetch = jest.fn();
  });

  it('renders registration form correctly', () => {
    render(<Register />);
    
    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/conferma password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crea account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrati con google/i })).toBeInTheDocument();
  });

  it('shows validation error for short password', async () => {
    const user = userEvent.setup();
    render(<Register />);
    
    const nameInput = screen.getByLabelText(/nome completo/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/conferma password/i);
    const submitButton = screen.getByRole('button', { name: /crea account/i });
    
    // Riempi tutti i campi richiesti con password troppo corta
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '123');
    await user.type(confirmPasswordInput, '123');
    
    // Clicca submit
    await user.click(submitButton);
    
    // Aspetta che appaia il messaggio di errore
    await waitFor(() => {
      expect(screen.getByText(/la password deve essere di almeno 8 caratteri/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows validation error for mismatched passwords', async () => {
    const user = userEvent.setup();
    render(<Register />);
    
    const nameInput = screen.getByLabelText(/nome completo/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/conferma password/i);
    const submitButton = screen.getByRole('button', { name: /crea account/i });
    
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password456');
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/le password non corrispondono/i)).toBeInTheDocument();
    });
  });

  it('has navigation links', () => {
    render(<Register />);
    
    expect(screen.getByText(/accedi qui/i)).toBeInTheDocument();
    expect(screen.getByText(/torna alla home/i)).toBeInTheDocument();
  });

  it('shows success message after successful registration', async () => {
    const user = userEvent.setup();
    
    // Mock successful registration
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Registrazione completata! Controlla la tua email.'
      })
    });

    render(<Register />);
    
    const nameInput = screen.getByLabelText(/nome completo/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/conferma password/i);
    const submitButton = screen.getByRole('button', { name: /crea account/i });
    
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/registrazione completata/i)).toBeInTheDocument();
    });
  });
});
