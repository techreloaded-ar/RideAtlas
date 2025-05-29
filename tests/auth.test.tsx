// Authentication Integration Test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import Register from '../src/app/auth/register/page';
import SignIn from '../src/app/auth/signin/page';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  signIn: jest.fn(),
  getProviders: jest.fn(() => Promise.resolve({
    google: {
      id: 'google',
      name: 'Google',
      type: 'oauth',
      signinUrl: '/api/auth/signin/google',
      callbackUrl: '/api/auth/callback/google'
    },
    credentials: {
      id: 'credentials',
      name: 'credentials',
      type: 'credentials',
      signinUrl: '/api/auth/signin/credentials',
      callbackUrl: '/api/auth/callback/credentials'
    }
  }))
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock fetch for registration
global.fetch = jest.fn();

describe('Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Registration Page', () => {
    it('renders registration form correctly', () => {
      render(<Register />);
      
      expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/conferma password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /crea account/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /registrati con google/i })).toBeInTheDocument();
    });

    it('validates password length correctly', async () => {
      render(<Register />);
      
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/conferma password/i);
      const submitButton = screen.getByRole('button', { name: /crea account/i });
      
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/la password deve essere di almeno 8 caratteri/i)).toBeInTheDocument();
      });
    });

    it('validates password confirmation', async () => {
      render(<Register />);
      
      const nameInput = screen.getByLabelText(/nome completo/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/conferma password/i);
      const submitButton = screen.getByRole('button', { name: /crea account/i });
      
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/le password non corrispondono/i)).toBeInTheDocument();
      });
    });
  });

  describe('SignIn Page', () => {
    it('renders signin form correctly', async () => {
      render(<SignIn />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^accedi$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /accedi con google/i })).toBeInTheDocument();
      });
    });

    it('has links to registration page', () => {
      render(<SignIn />);
      
      expect(screen.getByText(/registrati qui/i)).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('register page has link to signin', () => {
      render(<Register />);
      
      expect(screen.getByText(/accedi qui/i)).toBeInTheDocument();
    });

    it('both pages have link to home', () => {
      const { rerender } = render(<Register />);
      expect(screen.getByText(/torna alla home/i)).toBeInTheDocument();
      
      rerender(<SignIn />);
      expect(screen.getByText(/torna alla home/i)).toBeInTheDocument();
    });
  });
});
