// src/tests/unit/components/MultimediaUpload.test.tsx
import { render, screen, fireEvent, waitFor } from '../../setup/test-utils';
import userEvent from '@testing-library/user-event';
import MultimediaUpload from '@/components/upload/MultimediaUpload';
import { MediaItem } from '@/types/trip';

// Mock della funzione fetch globale
global.fetch = jest.fn();

// Mock di URL.createObjectURL
URL.createObjectURL = jest.fn(() => 'mock-url');
URL.revokeObjectURL = jest.fn();

describe('MultimediaUpload', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock della risposta per l'upload delle immagini
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://example.com/uploaded-image.jpg' })
    });
  });

  it('deve renderizzare correttamente la lista dei media esistenti', () => {
    render(
      <MultimediaUpload
        mediaItems={mockMediaItems}
        onAddMedia={mockOnAddMedia}
        onRemoveMedia={mockOnRemoveMedia}
        onUpdateCaption={mockOnUpdateCaption}
      />
    );
    
    // Verifica che tutti i media esistenti siano visualizzati
    const inputElements = screen.getAllByDisplayValue(/Immagine test|Video test/);
    expect(inputElements.length).toBe(2);
    expect(inputElements[0]).toHaveValue('Immagine test');
    expect(inputElements[1]).toHaveValue('Video test');
    
    // Verifica che ci sia un'immagine per ogni media
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(2);
  });

  it('deve permettere l\'eliminazione di un media', async () => {
    render(
      <MultimediaUpload
        mediaItems={mockMediaItems}
        onAddMedia={mockOnAddMedia}
        onRemoveMedia={mockOnRemoveMedia}
        onUpdateCaption={mockOnUpdateCaption}
      />
    );
    
    // Trova e clicca sul pulsante di eliminazione del primo media
    const deleteButtons = screen.getAllByText('Rimuovi');
    fireEvent.click(deleteButtons[0]);
    
    // Verifica che onRemoveMedia sia stato chiamato con l'id corretto
    expect(mockOnRemoveMedia).toHaveBeenCalledWith('1');
  });

  it('deve permettere la modifica della didascalia', async () => {
    render(
      <MultimediaUpload
        mediaItems={mockMediaItems}
        onAddMedia={mockOnAddMedia}
        onRemoveMedia={mockOnRemoveMedia}
        onUpdateCaption={mockOnUpdateCaption}
      />
    );
    
    // Trova gli input per la didascalia
    const captionInputs = screen.getAllByPlaceholderText('Aggiungi una didascalia...');
    
    // Reset delle chiamate mock prima del test
    mockOnUpdateCaption.mockReset();
    
    // Modifica la didascalia del primo media (usando onChange direttamente)
    fireEvent.change(captionInputs[0], { target: { value: 'Nuova didascalia' } });
    
    // Simula l'evento di blur per far scattare l'update
    fireEvent.blur(captionInputs[0]);
    
    // Verifica che onUpdateCaption sia stato chiamato con i parametri corretti
    expect(mockOnUpdateCaption).toHaveBeenCalledWith('1', 'Nuova didascalia');
  });

  it('deve validare correttamente gli URL di YouTube', async () => {
    render(
      <MultimediaUpload
        mediaItems={mockMediaItems}
        onAddMedia={mockOnAddMedia}
        onRemoveMedia={mockOnRemoveMedia}
        onUpdateCaption={mockOnUpdateCaption}
      />
    );
    
    // Trova l'input per l'URL di YouTube
    const youtubeInput = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');
    
    // Test con URL non valido
    await userEvent.type(youtubeInput, 'https://example.com/invalid');
    
    // Clicca sul pulsante di aggiunta
    const addButton = screen.getByText('Aggiungi');
    fireEvent.click(addButton);
    
    // Verifica che non sia stato chiamato onAddMedia
    expect(mockOnAddMedia).not.toHaveBeenCalled();
    // L'errore è mostrato in un alert, non possiamo verificarlo direttamente nel DOM
    // Il mock di window.alert verrà verificato in un test separato
    
    // Test con URL valido
    await userEvent.clear(youtubeInput);
    await userEvent.type(youtubeInput, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Clicca di nuovo sul pulsante
    fireEvent.click(addButton);
    
    // Verifica che onAddMedia sia stato chiamato con i dati corretti
    expect(mockOnAddMedia).toHaveBeenCalledWith({
      type: 'video',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      caption: ''
    });
  });

  it('deve gestire correttamente l\'upload delle immagini', async () => {
    const { container } = render(
      <MultimediaUpload
        mediaItems={mockMediaItems}
        onAddMedia={mockOnAddMedia}
        onRemoveMedia={mockOnRemoveMedia}
        onUpdateCaption={mockOnUpdateCaption}
      />
    );
    
    // Crea un file fittizio
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    // Trova l'input per il file utilizzando il container (è nascosto con className="hidden")
    const fileInput = container.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    
    // Simula l'upload direttamente sull'input
    await userEvent.upload(fileInput, file);
    
    // Aspetta che venga chiamato fetch (per l'upload)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    
    // Verifica che onAddMedia sia stato chiamato con i dati corretti
    await waitFor(() => {
      expect(mockOnAddMedia).toHaveBeenCalledWith({
        type: 'image',
        url: 'https://example.com/uploaded-image.jpg',
        caption: ''
      });
    });
  });

  it('deve mostrare alert per URL YouTube non validi', async () => {
    // Mock della funzione alert
    const originalAlert = window.alert;
    const mockAlert = jest.fn();
    window.alert = mockAlert;
    
    try {
      render(
        <MultimediaUpload
          mediaItems={mockMediaItems}
          onAddMedia={mockOnAddMedia}
          onRemoveMedia={mockOnRemoveMedia}
          onUpdateCaption={mockOnUpdateCaption}
        />
      );
      
      // Trova l'input per l'URL di YouTube
      const youtubeInput = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');
      
      // Test con URL non valido
      await userEvent.type(youtubeInput, 'https://example.com/invalid');
      
      // Clicca sul pulsante di aggiunta
      const addButton = screen.getByText('Aggiungi');
      fireEvent.click(addButton);
      
      // Verifica che l'alert sia stato mostrato con il messaggio corretto
      expect(mockAlert).toHaveBeenCalledWith('URL YouTube non valido. Assicurati di inserire un link YouTube corretto.');
      
    } finally {
      // Ripristina la funzione alert originale
      window.alert = originalAlert;
    }
  });

  it('deve gestire correttamente l\'upload di più immagini simultaneamente', async () => {
    const { container } = render(
      <MultimediaUpload
        mediaItems={[]}
        onAddMedia={mockOnAddMedia}
        onRemoveMedia={mockOnRemoveMedia}
        onUpdateCaption={mockOnUpdateCaption}
      />
    );
    
    // Crea due file fittizi
    const file1 = new File(['dummy content 1'], 'test-image-1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['dummy content 2'], 'test-image-2.jpg', { type: 'image/jpeg' });
    
    // Mock delle risposte per l'upload delle due immagini
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/uploaded-image-1.jpg' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://example.com/uploaded-image-2.jpg' })
      });
    
    // Trova l'input per il file
    const fileInput = container.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    
    // Simula l'upload di entrambi i file contemporaneamente
    Object.defineProperty(fileInput, 'files', {
      value: [file1, file2],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    // Aspetta che entrambi i fetch siano completati
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
    
    // Verifica che onAddMedia sia stato chiamato due volte con i dati corretti
    await waitFor(() => {
      expect(mockOnAddMedia).toHaveBeenCalledTimes(2);
      expect(mockOnAddMedia).toHaveBeenNthCalledWith(1, {
        type: 'image',
        url: 'https://example.com/uploaded-image-1.jpg',
        caption: ''
      });
      expect(mockOnAddMedia).toHaveBeenNthCalledWith(2, {
        type: 'image',
        url: 'https://example.com/uploaded-image-2.jpg',
        caption: ''
      });
    });
  });
});
