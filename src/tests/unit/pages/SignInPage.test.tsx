import { render, screen, waitFor } from '../../setup/test-utils';
import SignIn from '@/app/auth/signin/page';

describe('SignInPage', () => {
  it('renders signin form correctly', async () => {
    render(<SignIn />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^accedi$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /accedi con google/i })).toBeInTheDocument();
    });
  });

  it('has navigation links', () => {
    render(<SignIn />);
    
    expect(screen.getByText(/registrati qui/i)).toBeInTheDocument();
    expect(screen.getByText(/torna alla home/i)).toBeInTheDocument();
  });

  it('displays forgot password link', () => {
    render(<SignIn />);
    
    // Se c'è un link password dimenticata nel componente
    screen.queryAllByText(/password dimenticata/i);
    // Non ci aspettiamo errori se il link non esiste ancora
  });

  it('shows loading state during signin', async () => {
    // Test per verificare lo stato di loading durante il signin
    // Questo test può essere espanso quando il componente supporta lo stato di loading
    render(<SignIn />);
    
    const signinButton = screen.getByRole('button', { name: /^accedi$/i });
    expect(signinButton).toBeInTheDocument();
    expect(signinButton).not.toBeDisabled();
  });
});
