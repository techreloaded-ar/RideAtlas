import { render, screen, waitFor } from '../../setup/test-utils';
import userEvent from '@testing-library/user-event';
import ContattiPage from '@/app/contatti/page';

describe('ContattiPage', () => {
  beforeEach(() => {
    // Mock fetch globalmente per ogni test
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders contact page correctly', () => {
    render(<ContattiPage />);

    expect(screen.getByRole('heading', { name: /contatti/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/hai domande, suggerimenti/i)).toBeInTheDocument();
    expect(screen.getByText(/info@rideatlas\.it/i)).toBeInTheDocument();
  });

  it('renders contact form with all fields', () => {
    render(<ContattiPage />);

    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/messaggio/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /invia messaggio/i })).toBeInTheDocument();
  });

  it('shows validation error for nome too short', async () => {
    const user = userEvent.setup();
    render(<ContattiPage />);

    const nomeInput = screen.getByLabelText(/nome/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messaggioInput = screen.getByLabelText(/messaggio/i);
    const submitButton = screen.getByRole('button', { name: /invia messaggio/i });

    await user.type(nomeInput, 'M');
    await user.type(emailInput, 'mario@example.com');
    await user.type(messaggioInput, 'Messaggio valido con almeno 10 caratteri');

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/il nome deve contenere almeno 2 caratteri/i)).toBeInTheDocument();
    });
  });

  // Test rimosso: il browser valida il campo email con type="email" prima di React Hook Form
  // La validazione email è comunque coperta dai test dell'API e dello schema

  it('shows validation error for messaggio too short', async () => {
    const user = userEvent.setup();
    render(<ContattiPage />);

    const nomeInput = screen.getByLabelText(/nome/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messaggioInput = screen.getByLabelText(/messaggio/i);
    const submitButton = screen.getByRole('button', { name: /invia messaggio/i });

    await user.type(nomeInput, 'Mario Rossi');
    await user.type(emailInput, 'mario@example.com');
    await user.type(messaggioInput, 'Corto');

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/il messaggio deve contenere almeno 10 caratteri/i)).toBeInTheDocument();
    });
  });

  it('shows success message after successful submission', async () => {
    const user = userEvent.setup();

    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Messaggio inviato con successo!',
      }),
    });

    render(<ContattiPage />);

    const nomeInput = screen.getByLabelText(/nome/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messaggioInput = screen.getByLabelText(/messaggio/i);
    const submitButton = screen.getByRole('button', { name: /invia messaggio/i });

    await user.type(nomeInput, 'Mario Rossi');
    await user.type(emailInput, 'mario@example.com');
    await user.type(messaggioInput, 'Vorrei avere maggiori informazioni sui vostri itinerari.');

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/messaggio inviato con successo/i)).toBeInTheDocument();
    });
  });

  it('shows simulated message in development mode', async () => {
    const user = userEvent.setup();

    // Mock simulated response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Messaggio inviato con successo!',
        simulated: true,
      }),
    });

    render(<ContattiPage />);

    const nomeInput = screen.getByLabelText(/nome/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messaggioInput = screen.getByLabelText(/messaggio/i);
    const submitButton = screen.getByRole('button', { name: /invia messaggio/i });

    await user.type(nomeInput, 'Mario Rossi');
    await user.type(emailInput, 'mario@example.com');
    await user.type(messaggioInput, 'Messaggio di test in modalità sviluppo.');

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/messaggio simulato con successo.*modalità sviluppo/i)).toBeInTheDocument();
    });
  });

  it('shows error message when submission fails', async () => {
    const user = userEvent.setup();

    // Mock failed API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Si è verificato un errore durante l\'invio del messaggio.',
      }),
    });

    render(<ContattiPage />);

    const nomeInput = screen.getByLabelText(/nome/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messaggioInput = screen.getByLabelText(/messaggio/i);
    const submitButton = screen.getByRole('button', { name: /invia messaggio/i });

    await user.type(nomeInput, 'Mario Rossi');
    await user.type(emailInput, 'mario@example.com');
    await user.type(messaggioInput, 'Messaggio che causerà un errore.');

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/si è verificato un errore/i)).toBeInTheDocument();
    });
  });

  it('shows error message on network failure', async () => {
    const user = userEvent.setup();

    // Mock network failure
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ContattiPage />);

    const nomeInput = screen.getByLabelText(/nome/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messaggioInput = screen.getByLabelText(/messaggio/i);
    const submitButton = screen.getByRole('button', { name: /invia messaggio/i });

    await user.type(nomeInput, 'Mario Rossi');
    await user.type(emailInput, 'mario@example.com');
    await user.type(messaggioInput, 'Messaggio che causerà un errore di rete.');

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/errore di connessione/i)).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();

    // Mock delayed response
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, message: 'Messaggio inviato!' }),
      }), 1000))
    );

    render(<ContattiPage />);

    const nomeInput = screen.getByLabelText(/nome/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messaggioInput = screen.getByLabelText(/messaggio/i);
    const submitButton = screen.getByRole('button', { name: /invia messaggio/i });

    await user.type(nomeInput, 'Mario Rossi');
    await user.type(emailInput, 'mario@example.com');
    await user.type(messaggioInput, 'Messaggio di test per verificare disabilitazione.');

    await user.click(submitButton);

    // During submission, button should show "Invio in corso..."
    await waitFor(() => {
      expect(screen.getByText(/invio in corso/i)).toBeInTheDocument();
    });

    // Fields should be disabled
    expect(nomeInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(messaggioInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('clears form after successful submission', async () => {
    const user = userEvent.setup();

    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Messaggio inviato con successo!',
      }),
    });

    render(<ContattiPage />);

    const nomeInput = screen.getByLabelText(/nome/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const messaggioInput = screen.getByLabelText(/messaggio/i) as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /invia messaggio/i });

    await user.type(nomeInput, 'Mario Rossi');
    await user.type(emailInput, 'mario@example.com');
    await user.type(messaggioInput, 'Messaggio di test.');

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/messaggio inviato con successo/i)).toBeInTheDocument();
    });

    // Form should be cleared
    await waitFor(() => {
      expect(nomeInput.value).toBe('');
      expect(emailInput.value).toBe('');
      expect(messaggioInput.value).toBe('');
    });
  });

  it('displays email link correctly', () => {
    render(<ContattiPage />);

    const emailLink = screen.getByRole('link', { name: /info@rideatlas\.it/i });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:info@rideatlas.it');
  });

  it('shows character limit hint for messaggio', () => {
    render(<ContattiPage />);

    expect(screen.getByText(/minimo 10 caratteri, massimo 2000 caratteri/i)).toBeInTheDocument();
  });

  it('shows required field indicators', () => {
    render(<ContattiPage />);

    const requiredIndicators = screen.getAllByText('*');
    expect(requiredIndicators.length).toBeGreaterThan(0);
  });

  it('accepts valid form data with special characters', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Messaggio inviato con successo!',
      }),
    });

    render(<ContattiPage />);

    const nomeInput = screen.getByLabelText(/nome/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messaggioInput = screen.getByLabelText(/messaggio/i);
    const submitButton = screen.getByRole('button', { name: /invia messaggio/i });

    await user.type(nomeInput, "Mario D'Angelo");
    await user.type(emailInput, 'mario+test@example.com');
    await user.type(messaggioInput, 'Messaggio con caratteri speciali: àèìòù!');

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/messaggio inviato con successo/i)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/contact',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining("Mario D'Angelo"),
      })
    );
  });

  it('handles validation error response from API', async () => {
    const user = userEvent.setup();

    // Mock validation error from API
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Dati non validi',
        details: {
          email: ['Inserisci un indirizzo email valido'],
        },
      }),
    });

    render(<ContattiPage />);

    const nomeInput = screen.getByLabelText(/nome/i);
    const emailInput = screen.getByLabelText(/email/i);
    const messaggioInput = screen.getByLabelText(/messaggio/i);
    const submitButton = screen.getByRole('button', { name: /invia messaggio/i });

    await user.type(nomeInput, 'Mario Rossi');
    await user.type(emailInput, 'mario@example.com');
    await user.type(messaggioInput, 'Messaggio valido');

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/dati non validi/i)).toBeInTheDocument();
    });
  });
});
