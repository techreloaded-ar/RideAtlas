// src/tests/unit/components/MediaGallery.test.tsx
import { render, screen, fireEvent } from '../../setup/test-utils';
import { MediaItem } from '@/types/trip';
import MediaGallery from '@/components/upload/MediaGallery';

// Mock delle funzionalità dei browser come matchMedia necessarie per alcuni componenti UI
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {},
    addEventListener: function() {},
    removeEventListener: function() {},
    dispatchEvent: function() { return true; }
  };
};

describe('MediaGallery', () => {
  // Mock dei dati di test
  const mockMedia: MediaItem[] = [
    {
      id: '1',
      type: 'image',
      url: 'https://example.com/image1.jpg',
      caption: 'Prima immagine di test'
    },
    {
      id: '2',
      type: 'image',
      url: 'https://example.com/image2.jpg',
      caption: 'Seconda immagine di test'
    },
    {
      id: '3',
      type: 'video',
      url: 'https://www.youtube.com/embed/abcdef12345',
      thumbnailUrl: 'https://img.youtube.com/vi/abcdef12345/maxresdefault.jpg',
      caption: 'Video di test'
    }
  ];

  it('non deve renderizzare nulla quando non ci sono media', () => {
    const { container } = render(<MediaGallery media={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizzare l\'immagine attiva', () => {
    render(<MediaGallery media={mockMedia} />);
    
    // Per default, viene mostrato il primo elemento
    const image = screen.getByAltText('Prima immagine di test');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');
  });

  it('deve mostrare la didascalia quando presente', () => {
    render(<MediaGallery media={mockMedia} />);
    
    // Verifica che la didascalia del primo media sia visualizzata
    expect(screen.getByText('Prima immagine di test')).toBeInTheDocument();
  });

  it('deve permettere la navigazione tra i media', () => {
    render(<MediaGallery media={mockMedia} />);
    
    // All'inizio mostra il primo elemento
    expect(screen.getByAltText('Prima immagine di test')).toBeInTheDocument();
    
    // Trova e clicca sul pulsante "Successivo"
    const nextButton = screen.getByLabelText('Successivo');
    fireEvent.click(nextButton);
    
    // Ora dovrebbe mostrare il secondo elemento
    expect(screen.getByAltText('Seconda immagine di test')).toBeInTheDocument();
    
    // Clicca ancora per arrivare al terzo elemento (video)
    fireEvent.click(nextButton);
    
    // Per i video, verifichiamo l'iframe
    expect(screen.getByTitle('Video di test')).toBeInTheDocument();
    
    // Clicca sul pulsante "Precedente" per tornare al secondo elemento
    const prevButton = screen.getByLabelText('Precedente');
    fireEvent.click(prevButton);
    
    // Verifichiamo di nuovo il secondo elemento
    expect(screen.getByAltText('Seconda immagine di test')).toBeInTheDocument();
  });

  it('deve gestire correttamente la navigazione circolare', () => {
    render(<MediaGallery media={mockMedia} />);
    
    // Torna all'ultimo elemento dal primo
    const prevButton = screen.getByLabelText('Precedente');
    fireEvent.click(prevButton);
    
    // Dovrebbe mostrare l'ultimo elemento (video)
    expect(screen.getByTitle('Video di test')).toBeInTheDocument();
    
    // Avanza oltre l'ultimo elemento per tornare al primo
    const nextButton = screen.getByLabelText('Successivo');
    fireEvent.click(nextButton);
    
    // Dovrebbe tornare al primo elemento
    expect(screen.getByAltText('Prima immagine di test')).toBeInTheDocument();
  });

  it('deve gestire correttamente il rendering dei video', () => {
    render(<MediaGallery media={[mockMedia[2]]} />);
    
    // Verifichiamo che l'iframe per il video sia presente
    const iframe = screen.getByTitle('Video di test');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/abcdef12345');
    expect(iframe).toHaveAttribute('frameBorder', '0');
    expect(iframe).toHaveAttribute('allowFullScreen');
  });
});
