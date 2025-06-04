import { render, screen, waitFor } from '../setup/test-utils';
import userEvent from '@testing-library/user-event';
import Register from '@/app/auth/register/page';
import SignIn from '@/app/auth/signin/page';
import { signIn } from 'next-auth/react';

// Mock next-auth signIn
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

// Mock fetch globalmente
global.fetch = jest.fn();

// Mock window.location per evitare errori JSDOM
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
});

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn.mockClear();
  });

  describe('User Registration Flow', () => {
    it('completes registration flow and shows email verification message', async () => {
      const user = userEvent.setup();
      
      // Mock successful registration
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Registrazione completata! Controlla la tua email.',
          requiresVerification: true
        })
      });

      render(<Register />);
      
      // Compila il form di registrazione
      await user.type(screen.getByLabelText(/nome completo/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'ValidPass123');
      await user.type(screen.getByLabelText(/conferma password/i), 'ValidPass123');
      
      // Submit del form
      await user.click(screen.getByRole('button', { name: /crea account/i }));
      
      // Verifica il messaggio di successo
      await waitFor(() => {
        expect(screen.getByText(/registrazione completata!/i)).toBeInTheDocument();
      });

      // Verifica che sia stato fatto il fetch corretto
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'ValidPass123',
        }),
      });
    });

    it('handles registration errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock registration failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Email già in uso')
      );

      render(<Register />);
      
      // Compila il form
      await user.type(screen.getByLabelText(/nome completo/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'ValidPass123');
      await user.type(screen.getByLabelText(/conferma password/i), 'ValidPass123');
      
      // Submit
      await user.click(screen.getByRole('button', { name: /crea account/i }));
      
      // Verifica il messaggio di errore
      await waitFor(() => {
        expect(screen.getByText(/email già in uso/i)).toBeInTheDocument();
      });
    });

    it('allows resending verification email', async () => {
      const user = userEvent.setup();
      
      // Mock successful registration first
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: 'Registrazione completata! Controlla la tua email.'
          })
        })
        // Then mock successful resend
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: 'Email di verifica inviata nuovamente!'
          })
        });

      // Mock window.alert per il test
      window.alert = jest.fn();

      render(<Register />);
      
      // Completa registrazione
      await user.type(screen.getByLabelText(/nome completo/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'ValidPass123');
      await user.type(screen.getByLabelText(/conferma password/i), 'ValidPass123');
      await user.click(screen.getByRole('button', { name: /crea account/i }));
      
      // Aspetta la pagina di successo
      await waitFor(() => {
        expect(screen.getByText(/registrazione completata!/i)).toBeInTheDocument();
      });
      
      // Clicca il bottone per inviare nuovamente l'email
      const resendButton = screen.getByText(/invia nuovamente email/i);
      await user.click(resendButton);
      
      // Verifica che l'alert sia stato chiamato
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Email di verifica inviata nuovamente!');
      });
    });
  });

  describe('User Authentication Flow', () => {
    it('handles signin with unverified email', async () => {
      const user = userEvent.setup();
      
      // Mock signin per restituire errore per email non verificata
      mockSignIn.mockResolvedValueOnce({
        error: 'EmailNotVerified',
        status: 401,
        ok: false,
        url: null,
        code: 'EmailNotVerified'
      });

      render(<SignIn />);
      
      // Riempi il form di login
      await user.type(screen.getByLabelText(/email/i), 'unverified@example.com');
      await user.type(screen.getByLabelText(/password/i), 'ValidPass123');
      await user.click(screen.getByRole('button', { name: /^accedi$/i }));
      
      // Verifica che signIn sia stato chiamato
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'unverified@example.com',
        password: 'ValidPass123',
        redirect: false
      });
      
      // Verifica che appaia il messaggio di errore
      await waitFor(() => {
        expect(screen.getByText(/email non verificata/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Between Auth Pages', () => {
    it('navigates from signin to register', () => {
      render(<SignIn />);
      
      const registerLink = screen.getByText(/registrati qui/i);
      expect(registerLink).toBeInTheDocument();
      expect(registerLink.closest('a')).toHaveAttribute('href', '/auth/register');
    });

    it('navigates from register to signin', () => {
      render(<Register />);
      
      const signinLink = screen.getByText(/accedi qui/i);
      expect(signinLink).toBeInTheDocument();
      expect(signinLink.closest('a')).toHaveAttribute('href', '/auth/signin');
    });

    it('navigates back to home from both pages', () => {
      const { rerender } = render(<Register />);
      
      let homeLink = screen.getByText(/torna alla home/i);
      expect(homeLink).toBeInTheDocument();
      expect(homeLink.closest('a')).toHaveAttribute('href', '/');
      
      rerender(<SignIn />);
      
      homeLink = screen.getByText(/torna alla home/i);
      expect(homeLink).toBeInTheDocument();
      expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    });
  });
});
