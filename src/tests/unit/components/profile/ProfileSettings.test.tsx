// src/tests/unit/components/profile/ProfileSettings.test.tsx
import { render, screen, fireEvent, waitFor } from '../../../setup/test-utils';
import ProfileSettings from '@/components/profile/ProfileSettings';
import { UserRole } from '@/types/profile';

// Mock dei moduli
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/hooks/profile/useProfile', () => ({
  useProfile: jest.fn(),
}));

// Importa i mock dopo la definizione
import { useSession } from 'next-auth/react';
import { useProfile } from '@/hooks/profile/useProfile';

// Mock del fetch globale
global.fetch = jest.fn();

describe('ProfileSettings Component - Data Preservation Tests', () => {
  const mockUpdate = jest.fn();
  const mockRefetch = jest.fn().mockResolvedValue(undefined);

  const mockSession = {
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.Ranger,
    },
    expires: '2024-12-31',
  };

  const mockProfile = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    bio: 'Original bio content',
    bikeDescription: 'Original bike description',
    socialLinks: {
      instagram: 'https://instagram.com/testuser',
      facebook: 'https://facebook.com/testuser',
    },
    bikePhotos: [],
    role: UserRole.Ranger,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useSession
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: mockUpdate,
    });

    // Mock useProfile
    (useProfile as jest.Mock).mockReturnValue({
      profile: mockProfile,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    // Mock fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        user: mockProfile,
      }),
    });
  });

  describe('handleSaveProfile - Bio Update', () => {
    it('should include bikeDescription when saving bio', async () => {
      render(<ProfileSettings />);

      // Apri la sezione Informazioni Personali cliccando sul button che la contiene
      const personalButton = screen.getByRole('button', { name: /informazioni personali/i });
      fireEvent.click(personalButton);

      // Attendi che la sezione si apra e il campo biografia sia visibile
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Racconta qualcosa di te...')).toBeInTheDocument();
      });

      // Modifica la bio
      const bioTextarea = screen.getByPlaceholderText('Racconta qualcosa di te...');
      fireEvent.change(bioTextarea, {
        target: { value: 'Updated bio content' },
      });

      // Salva le modifiche
      const saveButton = screen.getByRole('button', { name: /salva modifiche/i });
      fireEvent.click(saveButton);

      // Verifica che fetch sia stato chiamato con TUTTI i campi
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/profile/update',
          expect.objectContaining({
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.any(String),
          })
        );
      });

      // Verifica che il body contenga bio, socialLinks E bikeDescription
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody).toEqual({
        name: 'Test User',
        bio: 'Updated bio content',
        socialLinks: {
          instagram: 'https://instagram.com/testuser',
          facebook: 'https://facebook.com/testuser',
        },
        bikeDescription: 'Original bike description', // ← DEVE essere presente!
      });
    });

    it('should preserve bikeDescription even if bio is empty', async () => {
      render(<ProfileSettings />);

      // Apri la sezione Informazioni Personali
      const personalButton = screen.getByRole('button', { name: /informazioni personali/i });
      fireEvent.click(personalButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Racconta qualcosa di te...')).toBeInTheDocument();
      });

      // Svuota la bio
      const bioTextarea = screen.getByPlaceholderText('Racconta qualcosa di te...');
      fireEvent.change(bioTextarea, {
        target: { value: '' },
      });

      // Salva le modifiche
      const saveButton = screen.getByRole('button', { name: /salva modifiche/i });
      fireEvent.click(saveButton);

      // Verifica che bikeDescription sia ancora presente nel body
      await waitFor(() => {
        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        const requestBody = JSON.parse(fetchCall[1].body);

        expect(requestBody.bikeDescription).toBe('Original bike description');
      });
    });
  });

  describe('handleSaveBikeDescription - Bike Update', () => {
    it('should include bio and socialLinks when saving bike description', async () => {
      render(<ProfileSettings />);

      // Apri la sezione Informazioni Motociclistiche
      const bikeButton = screen.getByRole('button', { name: /informazioni motociclistiche/i });
      fireEvent.click(bikeButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/BMW R1250GS Adventure/i)).toBeInTheDocument();
      });

      // Modifica la descrizione moto
      const bikeTextarea = screen.getByPlaceholderText(/BMW R1250GS Adventure/i);
      fireEvent.change(bikeTextarea, {
        target: { value: 'Updated bike description' },
      });

      // Salva la descrizione
      const saveButton = screen.getByRole('button', { name: /salva descrizione/i });
      fireEvent.click(saveButton);

      // Verifica che fetch sia stato chiamato con TUTTI i campi
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/profile/update',
          expect.objectContaining({
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.any(String),
          })
        );
      });

      // Verifica che il body contenga bio, socialLinks E bikeDescription
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody).toEqual({
        name: 'Test User',
        bio: 'Original bio content', // ← DEVE essere presente!
        socialLinks: {
          instagram: 'https://instagram.com/testuser',
          facebook: 'https://facebook.com/testuser',
        },
        bikeDescription: 'Updated bike description',
      });
    });

    it('should preserve bio even if bike description is empty', async () => {
      render(<ProfileSettings />);

      // Apri la sezione Informazioni Motociclistiche
      const bikeButton = screen.getByRole('button', { name: /informazioni motociclistiche/i });
      fireEvent.click(bikeButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/BMW R1250GS Adventure/i)).toBeInTheDocument();
      });

      // Svuota la descrizione moto
      const bikeTextarea = screen.getByPlaceholderText(/BMW R1250GS Adventure/i);
      fireEvent.change(bikeTextarea, {
        target: { value: '' },
      });

      // Salva la descrizione
      const saveButton = screen.getByRole('button', { name: /salva descrizione/i });
      fireEvent.click(saveButton);

      // Verifica che bio e socialLinks siano ancora presenti nel body
      await waitFor(() => {
        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        const requestBody = JSON.parse(fetchCall[1].body);

        expect(requestBody.bio).toBe('Original bio content');
        expect(requestBody.socialLinks).toEqual({
          instagram: 'https://instagram.com/testuser',
          facebook: 'https://facebook.com/testuser',
        });
      });
    });
  });

  describe('Cross-field data preservation', () => {
    it('should preserve all fields when updating bio multiple times', async () => {
      render(<ProfileSettings />);

      // Apri la sezione Informazioni Personali
      const personalButton = screen.getByRole('button', { name: /informazioni personali/i });
      fireEvent.click(personalButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Racconta qualcosa di te...')).toBeInTheDocument();
      });

      // Prima modifica
      const bioTextarea = screen.getByPlaceholderText('Racconta qualcosa di te...');
      fireEvent.change(bioTextarea, {
        target: { value: 'First update' },
      });

      const saveButton = screen.getByRole('button', { name: /salva modifiche/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Seconda modifica
      fireEvent.change(bioTextarea, {
        target: { value: 'Second update' },
      });

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      // Verifica che in entrambe le chiamate bikeDescription sia presente
      const firstCall = (global.fetch as jest.Mock).mock.calls[0];
      const firstBody = JSON.parse(firstCall[1].body);
      expect(firstBody.bikeDescription).toBe('Original bike description');

      const secondCall = (global.fetch as jest.Mock).mock.calls[1];
      const secondBody = JSON.parse(secondCall[1].body);
      expect(secondBody.bikeDescription).toBe('Original bike description');
    });

    it('should preserve all fields when alternating between bio and bike updates', async () => {
      render(<ProfileSettings />);

      // Aggiorna la bio
      const personalButton = screen.getByRole('button', { name: /informazioni personali/i });
      fireEvent.click(personalButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Racconta qualcosa di te...')).toBeInTheDocument();
      });

      const bioTextarea = screen.getByPlaceholderText('Racconta qualcosa di te...');
      fireEvent.change(bioTextarea, {
        target: { value: 'Updated bio' },
      });

      const saveBioButton = screen.getByRole('button', { name: /salva modifiche/i });
      fireEvent.click(saveBioButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Aggiorna la moto
      const bikeButton = screen.getByRole('button', { name: /informazioni motociclistiche/i });
      fireEvent.click(bikeButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/BMW R1250GS Adventure/i)).toBeInTheDocument();
      });

      const bikeTextarea = screen.getByPlaceholderText(/BMW R1250GS Adventure/i);
      fireEvent.change(bikeTextarea, {
        target: { value: 'Updated bike' },
      });

      const saveBikeButton = screen.getByRole('button', { name: /salva descrizione/i });
      fireEvent.click(saveBikeButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      // Verifica prima chiamata (bio update)
      const firstCall = (global.fetch as jest.Mock).mock.calls[0];
      const firstBody = JSON.parse(firstCall[1].body);
      expect(firstBody.bio).toBe('Updated bio');
      expect(firstBody.bikeDescription).toBe('Original bike description');

      // Verifica seconda chiamata (bike update)
      // NOTA: Il formData ora contiene la bio aggiornata dal salvataggio precedente
      const secondCall = (global.fetch as jest.Mock).mock.calls[1];
      const secondBody = JSON.parse(secondCall[1].body);
      expect(secondBody.bio).toBe('Updated bio'); // ← Mantiene la bio aggiornata
      expect(secondBody.bikeDescription).toBe('Updated bike');
    });
  });
});
