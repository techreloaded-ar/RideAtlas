// src/tests/unit/components/UnifiedMediaGallery.test.tsx
import { render, screen, fireEvent } from '../../setup/test-utils';
import { MediaItem } from '@/types/trip';
import { UnifiedMediaGallery } from '@/components/ui/UnifiedMediaGallery';

// Mock delle funzionalità dei browser
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

describe('UnifiedMediaGallery - Test Essenziali', () => {
  const mockImage: MediaItem = {
    id: '1',
    type: 'image',
    url: 'https://example.com/image.jpg',
    caption: 'Test image'
  };

  const mockVideo: MediaItem = {
    id: '2',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    caption: 'Test video'
  };

  describe('📱 Rendering Base', () => {
    it('non renderizza nulla con array vuoto', () => {
      const { container } = render(<UnifiedMediaGallery media={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renderizza immagine singola correttamente', () => {
      render(<UnifiedMediaGallery media={[mockImage]} />);
      expect(screen.getByText('Test image')).toBeInTheDocument();
    });
  });

  describe('🎥 YouTube Lazy Loading', () => {
    it('mostra thumbnail YouTube inizialmente, non iframe', () => {
      render(<UnifiedMediaGallery media={[mockVideo]} />);
      
      // Deve esserci la caption del video
      expect(screen.getByText('Test video')).toBeInTheDocument();
      
      // Non deve esserci iframe YouTube inizialmente
      expect(screen.queryByTitle('Test video')).not.toBeInTheDocument();
    });

    it('ha contenitore cliccabile per video', () => {
      render(<UnifiedMediaGallery media={[mockVideo]} />);
      
      // Deve esserci un elemento con role button per il consenso video
      const videoButtons = screen.getAllByRole('button');
      expect(videoButtons.length).toBeGreaterThan(0);

      // Verifica che ci sia almeno un button per il consenso video
      const consentButton = screen.getByText('Accetta per tutti i video');
      expect(consentButton).toBeInTheDocument();
    });
  });

  describe('🖼️ Navigazione Base', () => {
    const multiMedia = [mockImage, mockVideo];

    it('mostra contatore con più media', () => {
      render(<UnifiedMediaGallery media={multiMedia} />);
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('ha pulsanti di navigazione con più media', () => {
      render(<UnifiedMediaGallery media={multiMedia} />);
      
      expect(screen.getByLabelText('Media precedente')).toBeInTheDocument();
      expect(screen.getByLabelText('Media successivo')).toBeInTheDocument();
    });

    it('cambia contatore con navigazione', () => {
      render(<UnifiedMediaGallery media={multiMedia} />);
      
      // Click avanti
      const nextButton = screen.getByLabelText('Media successivo');
      fireEvent.click(nextButton);
      
      // Contatore dovrebbe cambiare
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });
  });

  describe('♿ Accessibilità', () => {
    it('ha aria-labels corretti per navigazione', () => {
      render(<UnifiedMediaGallery media={[mockImage, mockVideo]} />);
      
      expect(screen.getByLabelText('Media precedente')).toBeInTheDocument();
      expect(screen.getByLabelText('Media successivo')).toBeInTheDocument();
    });
  });
});