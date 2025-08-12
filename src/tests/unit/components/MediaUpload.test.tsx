// src/tests/unit/components/MediaUpload.test.tsx
import { render, screen, fireEvent, waitFor } from '../../setup/test-utils';
import userEvent from '@testing-library/user-event';
import MediaUpload from '@/components/upload/MediaUpload';
import { MediaItem } from '@/types/trip';

// Mock della funzione fetch globale
global.fetch = jest.fn();

// Mock di URL.createObjectURL
URL.createObjectURL = jest.fn(() => 'mock-url');
URL.revokeObjectURL = jest.fn();

describe('MediaUpload', () => {
  // Mock delle funzioni di callback
  const mockOnAddMedia = jest.fn();
  const mockOnRemoveMedia = jest.fn();
  const mockOnUpdateCaption = jest.fn();
  
  // Dati di esempio
  const mockMediaItems: MediaItem[] = [
    {
      id: '1',
      type: 'image',
      url: 'https://example.com/image1.jpg',
      caption: 'Immagine test'
    },
    {
      id: '2',
      type: 'video',
      url: 'https://www.youtube.com/embed/abcdef12345',
      thumbnailUrl: 'https://img.youtube.com/vi/abcdef12345/maxresdefault.jpg',
      caption: 'Video test'
    }
  ];


  const defaultProps = {
    mediaItems: [],
    onAddMedia: mockOnAddMedia,
    onRemoveMedia: mockOnRemoveMedia,
    onUpdateCaption: mockOnUpdateCaption,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock della risposta per l'upload delle immagini
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://example.com/uploaded-image.jpg' })
    });
  });

  describe('Basic Rendering', () => {
    it('deve renderizzare correttamente con configurazione default', () => {
      render(<MediaUpload {...defaultProps} />);
      
      expect(screen.getByText('Multimedia')).toBeInTheDocument();
      expect(screen.getByText('Carica Immagini')).toBeInTheDocument();
      expect(screen.getByText('Aggiungi Video YouTube')).toBeInTheDocument();
      expect(screen.queryByText('Carica File GPX')).not.toBeInTheDocument();
    });


    it('deve nascondere YouTube quando disabilitato', () => {
      render(
        <MediaUpload 
          {...defaultProps}
          config={{ enableYoutube: false }}
        />
      );
      
      expect(screen.queryByText('Aggiungi Video YouTube')).not.toBeInTheDocument();
    });
  });

  describe('Media Items Display', () => {
    it('deve renderizzare correttamente la lista dei media esistenti', () => {
      render(
        <MediaUpload 
          {...defaultProps}
          mediaItems={mockMediaItems}
        />
      );
      
      expect(screen.getByText('Media Aggiunti (2)')).toBeInTheDocument();
      
      // Verifica che le immagini siano visualizzate
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThanOrEqual(2);
      
      // Verifica che i campi di caption siano presenti
      const captionInputs = screen.getAllByPlaceholderText('Aggiungi una didascalia...');
      expect(captionInputs).toHaveLength(2);
      
      // Verifica che i valori delle caption siano corretti
      expect(captionInputs[0]).toHaveValue('Immagine test');
      expect(captionInputs[1]).toHaveValue('Video test');
    });

    it('deve permettere l\'eliminazione di un media', async () => {
      render(
        <MediaUpload 
          {...defaultProps}
          mediaItems={mockMediaItems}
        />
      );
      
      // Trova e clicca sul pulsante di eliminazione del primo media (pulsante X rosso)
      const deleteButtons = screen.getAllByRole('button');
      const removeButtons = deleteButtons.filter(btn => 
        btn.className.includes('bg-red-500') && btn.className.includes('rounded-full')
      );
      fireEvent.click(removeButtons[0]);

      // Verifica che la callback sia stata chiamata con l'ID corretto
      expect(mockOnRemoveMedia).toHaveBeenCalledWith('1');
    });

    it('deve permettere la modifica della didascalia', async () => {
      render(
        <MediaUpload
          {...defaultProps}
          mediaItems={mockMediaItems}
        />
      );

      const captionInput = screen.getAllByPlaceholderText('Aggiungi una didascalia...')[0];

      // Reset del mock per evitare interferenze
      mockOnUpdateCaption.mockClear();

      // Simula l'evento onChange direttamente
      fireEvent.change(captionInput, { target: { value: 'Nuova didascalia' } });

      // Verifica che la callback sia stata chiamata correttamente
      expect(mockOnUpdateCaption).toHaveBeenCalledWith('1', 'Nuova didascalia');
    });
  });

  describe('Image Upload', () => {
    it('deve gestire l\'upload di immagini tramite file input', async () => {
      render(<MediaUpload {...defaultProps} />);
      
      const fileInput = document.getElementById('unified-images') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(mockOnAddMedia).toHaveBeenCalledWith({
          type: 'image',
          url: 'https://example.com/uploaded-image.jpg',
          caption: '',
          thumbnailUrl: undefined
        });
      });
    });

    it('deve gestire errori di upload', async () => {
      // Mock di una risposta di errore
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Upload failed' })
      });

      render(<MediaUpload {...defaultProps} />);
      
      const fileInput = document.getElementById('unified-images') as HTMLInputElement;
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/Upload failed/)).toBeInTheDocument();
      });

      expect(mockOnAddMedia).not.toHaveBeenCalled();
    });

    it.skip('deve validare il tipo di file', async () => {
      render(<MediaUpload {...defaultProps} />);
      
      const fileInput = document.getElementById('unified-images') as HTMLInputElement;
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/non è un'immagine valida/)).toBeInTheDocument();
      });

      expect(mockOnAddMedia).not.toHaveBeenCalled();
    });

    it('deve rispettare il limite di dimensione configurabile', async () => {
      render(
        <MediaUpload 
          {...defaultProps} 
          config={{ maxImageSize: 1 }} // 1MB limit
        />
      );
      
      const fileInput = document.getElementById('unified-images') as HTMLInputElement;
      // File troppo grande (2MB)
      const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

      await userEvent.upload(fileInput, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/troppo grande \(max 1MB\)/)).toBeInTheDocument();
      });

      expect(mockOnAddMedia).not.toHaveBeenCalled();
    });
  });

  describe('YouTube Integration', () => {
    it('deve permettere l\'aggiunta di video YouTube validi', async () => {
      render(<MediaUpload {...defaultProps} />);
      
      const youtubeInput = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');
      const addButton = screen.getByRole('button', { name: 'Aggiungi' });

      await userEvent.type(youtubeInput, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockOnAddMedia).toHaveBeenCalledWith({
          type: 'video',
          url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          caption: '',
          thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
        });
      });

      // Verifica che l'input sia stato pulito
      expect(youtubeInput).toHaveValue('');
    });

    it('deve validare l\'URL YouTube', async () => {
      render(<MediaUpload {...defaultProps} />);
      
      const youtubeInput = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');
      const addButton = screen.getByRole('button', { name: 'Aggiungi' });

      await userEvent.type(youtubeInput, 'https://invalid-url.com');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/URL YouTube non valido/)).toBeInTheDocument();
      });

      expect(mockOnAddMedia).not.toHaveBeenCalled();
    });

    it('non deve mostrare la sezione YouTube quando disabilitata', () => {
      render(
        <MediaUpload 
          {...defaultProps}
          config={{ enableYoutube: false }}
        />
      );

      expect(screen.queryByText('Aggiungi Video YouTube')).not.toBeInTheDocument();
    });
  });


  describe('Drag and Drop', () => {
    it('deve gestire il drag over', () => {
      render(<MediaUpload {...defaultProps} />);
      
      const dropZone = screen.getByText(/Clicca per selezionare o trascina le immagini qui/);
      
      fireEvent.dragOver(dropZone);
      
      expect(screen.getByText('Rilascia le immagini qui')).toBeInTheDocument();
    });

    it('deve gestire il drop di file', async () => {
      render(<MediaUpload {...defaultProps} />);
      
      const dropZone = screen.getByText(/Clicca per selezionare o trascina le immagini qui/);
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(mockOnAddMedia).toHaveBeenCalledWith({
          type: 'image',
          url: 'https://example.com/uploaded-image.jpg',
          caption: '',
          thumbnailUrl: undefined
        });
      });
    });
  });

  describe('Configuration', () => {
    it('deve rispettare tutte le configurazioni', () => {
      render(
        <MediaUpload 
          {...defaultProps}
          config={{
            enableYoutube: false,
            maxImageSize: 5,
          }}
        />
      );

      expect(screen.queryByText('Aggiungi Video YouTube')).not.toBeInTheDocument();
      expect(screen.queryByText('Carica File GPX')).not.toBeInTheDocument();
      expect(screen.getByText(/PNG, JPG, WebP fino a 5MB/)).toBeInTheDocument();
    });

    it('deve funzionare con configurazione vuota (defaults)', () => {
      render(<MediaUpload {...defaultProps} config={{}} />);
      
      expect(screen.getByText('Aggiungi Video YouTube')).toBeInTheDocument();
      expect(screen.queryByText('Carica File GPX')).not.toBeInTheDocument();
      expect(screen.getByText(/PNG, JPG, WebP fino a 10MB/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('deve mostrare errori di upload', async () => {
      render(<MediaUpload {...defaultProps} />);
      
      const youtubeInput = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');
      const addButton = screen.getByRole('button', { name: 'Aggiungi' });

      await userEvent.type(youtubeInput, 'invalid-url');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/URL YouTube non valido/)).toBeInTheDocument();
      });
    });

  });
});