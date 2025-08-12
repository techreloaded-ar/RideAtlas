import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useMediaUpload } from '@/hooks/upload/useMediaUpload';
import { MediaItem } from '@/types/trip';

// Mock fetch with proper typing
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock URL.createObjectURL
const mockCreateObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;

// Helper to create a mock Response
const createMockResponse = (options: {
  ok?: boolean;
  status?: number;
  headers?: Record<string, string>;
  json?: () => Promise<any>;
}): Response => {
  const headers = new Headers(options.headers || {});
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    headers,
    json: options.json || (async () => ({})),
  } as Response;
};

// Helper to create a mock File
const createMockFile = (name: string, type: string, size: number = 1000): File => {
  const content = 'a'.repeat(size); // Create content of specified size
  const file = new File([content], name, { type, lastModified: Date.now() });
  
  // Override size property to ensure it matches our specified size
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false
  });
  
  return file;
};

// Helper to create a mock input event
const createMockInputEvent = (files: File[]): React.ChangeEvent<HTMLInputElement> => {
  const input = document.createElement('input');
  input.type = 'file';
  
  // Mock files property
  Object.defineProperty(input, 'files', {
    value: {
      length: files.length,
      ...files,
      [Symbol.iterator]: function* () {
        for (let i = 0; i < files.length; i++) {
          yield files[i];
        }
      }
    },
    configurable: true
  });
  
  return { target: input } as React.ChangeEvent<HTMLInputElement>;
};

describe('useMediaUpload Hook', () => {
  const mockOnMediaUpdate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const defaultProps = {
    currentMedia: [],
    onMediaUpdate: mockOnMediaUpdate,
  };

  describe('Inizializzazione', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useMediaUpload(defaultProps));

      expect(result.current.isUploading).toBe(false);
      expect(result.current.uploadError).toBeNull();
      expect(typeof result.current.handleImageUpload).toBe('function');
      expect(typeof result.current.removeExistingMedia).toBe('function');
      expect(typeof result.current.updateMediaCaption).toBe('function');
    });


    it('should handle undefined currentMedia gracefully', () => {
      const { result } = renderHook(() => 
        useMediaUpload({ ...defaultProps, currentMedia: undefined })
      );

      expect(result.current.isUploading).toBe(false);
      expect(result.current.uploadError).toBeNull();
    });
  });

  describe('Upload Immagini', () => {
    it('should handle successful single image upload', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: true,
          json: async () => ({ url: 'https://example.com/uploaded-image.jpg' }),
        })
      );

      const { result } = renderHook(() => useMediaUpload(defaultProps));
      const mockFile = createMockFile('test.jpg', 'image/jpeg');
      const mockEvent = createMockInputEvent([mockFile]);

      await act(async () => {
        await result.current.handleImageUpload(mockEvent);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockOnMediaUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'image',
            url: 'https://example.com/uploaded-image.jpg',
            caption: ''
          })
        ])
      );
      expect(result.current.isUploading).toBe(false);
      expect(result.current.uploadError).toBeNull();
    });

    it('should handle multiple image uploads', async () => {
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({
            ok: true,
            json: async () => ({ url: 'https://example.com/image1.jpg' }),
          })
        )
        .mockResolvedValueOnce(
          createMockResponse({
            ok: true,
            json: async () => ({ url: 'https://example.com/image2.jpg' }),
          })
        );

      const { result } = renderHook(() => useMediaUpload(defaultProps));
      const mockFiles = [
        createMockFile('test1.jpg', 'image/jpeg'),
        createMockFile('test2.png', 'image/png')
      ];
      const mockEvent = createMockInputEvent(mockFiles);

      await act(async () => {
        await result.current.handleImageUpload(mockEvent);
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockOnMediaUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'image',
            url: 'https://example.com/image1.jpg'
          }),
          expect.objectContaining({
            type: 'image',
            url: 'https://example.com/image2.jpg'
          })
        ])
      );
    });

    it('should preserve existing media when adding new images', async () => {
      const existingMedia: MediaItem[] = [
        { id: 'existing-1', type: 'image', url: 'existing.jpg', caption: 'Existing' }
      ];

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: true,
          json: async () => ({ url: 'https://example.com/new-image.jpg' }),
        })
      );

      const { result } = renderHook(() => 
        useMediaUpload({ ...defaultProps, currentMedia: existingMedia })
      );
      
      const mockFile = createMockFile('new.jpg', 'image/jpeg');
      const mockEvent = createMockInputEvent([mockFile]);

      await act(async () => {
        await result.current.handleImageUpload(mockEvent);
      });

      expect(mockOnMediaUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'existing-1',
            url: 'existing.jpg'
          }),
          expect.objectContaining({
            type: 'image',
            url: 'https://example.com/new-image.jpg'
          })
        ])
      );
    });

    it('should reject non-image files', async () => {
      const { result } = renderHook(() => useMediaUpload(defaultProps));
      const mockFile = createMockFile('document.pdf', 'application/pdf');
      const mockEvent = createMockInputEvent([mockFile]);

      await act(async () => {
        await result.current.handleImageUpload(mockEvent);
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.uploadError).toBe("document.pdf non è un'immagine valida");
      expect(result.current.isUploading).toBe(false);
    });

    it('should reject files larger than 10MB', async () => {
      const { result } = renderHook(() => useMediaUpload(defaultProps));
      const largeFile = createMockFile('large.jpg', 'image/jpeg', 11 * 1024 * 1024); // 11MB
      const mockEvent = createMockInputEvent([largeFile]);

      await act(async () => {
        await result.current.handleImageUpload(mockEvent);
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.uploadError).toBe('large.jpg è troppo grande (max 10MB)');
      expect(result.current.isUploading).toBe(false);
    });

    it('should handle API upload errors', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Upload failed on server' }),
        })
      );

      const { result } = renderHook(() => useMediaUpload(defaultProps));
      const mockFile = createMockFile('test.jpg', 'image/jpeg');
      const mockEvent = createMockInputEvent([mockFile]);

      await act(async () => {
        await result.current.handleImageUpload(mockEvent);
      });

      expect(result.current.uploadError).toBe('Upload failed on server');
      expect(result.current.isUploading).toBe(false);
      expect(mockOnMediaUpdate).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useMediaUpload(defaultProps));
      const mockFile = createMockFile('test.jpg', 'image/jpeg');
      const mockEvent = createMockInputEvent([mockFile]);

      await act(async () => {
        await result.current.handleImageUpload(mockEvent);
      });

      expect(result.current.uploadError).toBe('Network error');
      expect(result.current.isUploading).toBe(false);
      expect(mockOnMediaUpdate).not.toHaveBeenCalled();
    });

    it('should clear input value after upload', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: true,
          json: async () => ({ url: 'https://example.com/uploaded-image.jpg' }),
        })
      );

      const { result } = renderHook(() => useMediaUpload(defaultProps));
      const mockFile = createMockFile('test.jpg', 'image/jpeg');
      const mockEvent = createMockInputEvent([mockFile]);

      await act(async () => {
        await result.current.handleImageUpload(mockEvent);
      });

      expect(mockEvent.target.value).toBe('');
    });

    it('should set loading state during upload', async () => {
      let resolvePromise: (value: Response) => void;
      const uploadPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(uploadPromise);

      const { result } = renderHook(() => useMediaUpload(defaultProps));
      const mockFile = createMockFile('test.jpg', 'image/jpeg');
      const mockEvent = createMockInputEvent([mockFile]);

      // Start upload
      act(() => {
        result.current.handleImageUpload(mockEvent);
      });

      // Should be loading
      expect(result.current.isUploading).toBe(true);
      expect(result.current.uploadError).toBeNull();

      // Complete upload
      await act(async () => {
        resolvePromise!(createMockResponse({
          ok: true,
          json: async () => ({ url: 'https://example.com/uploaded-image.jpg' }),
        }));
        await uploadPromise;
      });

      // Should no longer be loading
      expect(result.current.isUploading).toBe(false);
    });

    it('should handle empty file list', async () => {
      const { result } = renderHook(() => useMediaUpload(defaultProps));
      const mockEvent = createMockInputEvent([]);

      await act(async () => {
        await result.current.handleImageUpload(mockEvent);
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockOnMediaUpdate).not.toHaveBeenCalled();
      expect(result.current.uploadError).toBeNull();
    });
  });


  describe('Gestione Media', () => {
    describe('removeExistingMedia', () => {
      it('should remove media by ID', async () => {
        const existingMedia: MediaItem[] = [
          { id: 'media-1', type: 'image', url: 'image1.jpg', caption: 'First' },
          { id: 'media-2', type: 'image', url: 'image2.jpg', caption: 'Second' },
          { id: 'media-3', type: 'image', url: 'image3.jpg', caption: 'Third' }
        ];

        const { result } = renderHook(() => 
          useMediaUpload({ ...defaultProps, currentMedia: existingMedia })
        );

        await act(async () => {
          result.current.removeExistingMedia('media-2');
        });

        expect(mockOnMediaUpdate).toHaveBeenCalledWith([
          { id: 'media-1', type: 'image', url: 'image1.jpg', caption: 'First' },
          { id: 'media-3', type: 'image', url: 'image3.jpg', caption: 'Third' }
        ]);
      });

      it('should handle removing non-existent media ID', async () => {
        const existingMedia: MediaItem[] = [
          { id: 'media-1', type: 'image', url: 'image1.jpg', caption: 'First' }
        ];

        const { result } = renderHook(() => 
          useMediaUpload({ ...defaultProps, currentMedia: existingMedia })
        );

        await act(async () => {
          result.current.removeExistingMedia('non-existent-id');
        });

        expect(mockOnMediaUpdate).toHaveBeenCalledWith([
          { id: 'media-1', type: 'image', url: 'image1.jpg', caption: 'First' }
        ]);
      });

      it('should handle empty media array', async () => {
        const { result } = renderHook(() => useMediaUpload(defaultProps));

        await act(async () => {
          result.current.removeExistingMedia('any-id');
        });

        expect(mockOnMediaUpdate).toHaveBeenCalledWith([]);
      });

      it('should handle undefined currentMedia', async () => {
        const { result } = renderHook(() => 
          useMediaUpload({ ...defaultProps, currentMedia: undefined })
        );

        await act(async () => {
          result.current.removeExistingMedia('any-id');
        });

        expect(mockOnMediaUpdate).toHaveBeenCalledWith([]);
      });
    });

    describe('updateMediaCaption', () => {
      it('should update caption for existing media', async () => {
        const existingMedia: MediaItem[] = [
          { id: 'media-1', type: 'image', url: 'image1.jpg', caption: 'Old caption' },
          { id: 'media-2', type: 'image', url: 'image2.jpg', caption: 'Another caption' }
        ];

        const { result } = renderHook(() => 
          useMediaUpload({ ...defaultProps, currentMedia: existingMedia })
        );

        await act(async () => {
          result.current.updateMediaCaption('media-1', 'New caption');
        });

        expect(mockOnMediaUpdate).toHaveBeenCalledWith([
          { id: 'media-1', type: 'image', url: 'image1.jpg', caption: 'New caption' },
          { id: 'media-2', type: 'image', url: 'image2.jpg', caption: 'Another caption' }
        ]);
      });

      it('should handle updating non-existent media ID', async () => {
        const existingMedia: MediaItem[] = [
          { id: 'media-1', type: 'image', url: 'image1.jpg', caption: 'Original' }
        ];

        const { result } = renderHook(() => 
          useMediaUpload({ ...defaultProps, currentMedia: existingMedia })
        );

        await act(async () => {
          result.current.updateMediaCaption('non-existent-id', 'New caption');
        });

        expect(mockOnMediaUpdate).toHaveBeenCalledWith([
          { id: 'media-1', type: 'image', url: 'image1.jpg', caption: 'Original' }
        ]);
      });

      it('should handle empty caption', async () => {
        const existingMedia: MediaItem[] = [
          { id: 'media-1', type: 'image', url: 'image1.jpg', caption: 'Original caption' }
        ];

        const { result } = renderHook(() => 
          useMediaUpload({ ...defaultProps, currentMedia: existingMedia })
        );

        await act(async () => {
          result.current.updateMediaCaption('media-1', '');
        });

        expect(mockOnMediaUpdate).toHaveBeenCalledWith([
          { id: 'media-1', type: 'image', url: 'image1.jpg', caption: '' }
        ]);
      });

      it('should handle undefined currentMedia', async () => {
        const { result } = renderHook(() => 
          useMediaUpload({ ...defaultProps, currentMedia: undefined })
        );

        await act(async () => {
          result.current.updateMediaCaption('any-id', 'New caption');
        });

        expect(mockOnMediaUpdate).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Edge Cases e Gestione Errori', () => {

    it('should handle mixed valid and invalid files in image upload', async () => {
      const { result } = renderHook(() => useMediaUpload(defaultProps));
      const mixedFiles = [
        createMockFile('invalid.pdf', 'application/pdf'), // Invalid file first
        createMockFile('valid.jpg', 'image/jpeg')
      ];
      const mockEvent = createMockInputEvent(mixedFiles);

      await act(async () => {
        await result.current.handleImageUpload(mockEvent);
      });

      // Should fail on the first invalid file and not process any
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.uploadError).toBe("invalid.pdf non è un'immagine valida");
      expect(mockOnMediaUpdate).not.toHaveBeenCalled();
    });

    it('should handle API response without URL', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: true,
          json: async () => ({}), // No URL in response
        })
      );

      const { result } = renderHook(() => useMediaUpload(defaultProps));
      const mockFile = createMockFile('test.jpg', 'image/jpeg');
      const mockEvent = createMockInputEvent([mockFile]);

      await act(async () => {
        await result.current.handleImageUpload(mockEvent);
      });

      // Should still call onMediaUpdate with undefined URL
      expect(mockOnMediaUpdate).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'image',
          url: undefined,
          caption: ''
        })
      ]);
    });

    it('should handle props changing during upload', async () => {
      // Test that the hook uses the most current callback reference
      const { result, rerender } = renderHook(
        (props) => useMediaUpload(props),
        { initialProps: defaultProps }
      );

      // Change props before upload
      const newOnMediaUpdate = jest.fn();
      rerender({ ...defaultProps, onMediaUpdate: newOnMediaUpdate });

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: true,
          json: async () => ({ url: 'https://example.com/uploaded-image.jpg' }),
        })
      );

      const mockFile = createMockFile('test.jpg', 'image/jpeg');
      const mockEvent = createMockInputEvent([mockFile]);

      // Start and complete upload
      await act(async () => {
        await result.current.handleImageUpload(mockEvent);
      });

      // Should call the new callback
      expect(newOnMediaUpdate).toHaveBeenCalled();
      expect(mockOnMediaUpdate).not.toHaveBeenCalled();
    });

    it('should handle callback props being undefined', async () => {
      const propsWithUndefinedCallbacks = {
        currentMedia: [],
        onMediaUpdate: undefined as any,
      };

      // This should not crash
      const { result } = renderHook(() => useMediaUpload(propsWithUndefinedCallbacks));

      expect(result.current.isUploading).toBe(false);
      expect(result.current.uploadError).toBeNull();
    });

    it('should reset upload error when starting new upload', async () => {
      const { result } = renderHook(() => useMediaUpload(defaultProps));

      // Set an initial error
      const invalidFile = createMockFile('invalid.pdf', 'application/pdf');
      const invalidEvent = createMockInputEvent([invalidFile]);

      await act(async () => {
        await result.current.handleImageUpload(invalidEvent);
      });

      expect(result.current.uploadError).toBe("invalid.pdf non è un'immagine valida");

      // Now upload a valid file - error should be cleared
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: true,
          json: async () => ({ url: 'https://example.com/valid-image.jpg' }),
        })
      );

      const validFile = createMockFile('valid.jpg', 'image/jpeg');
      const validEvent = createMockInputEvent([validFile]);

      await act(async () => {
        await result.current.handleImageUpload(validEvent);
      });

      expect(result.current.uploadError).toBeNull();
    });

    it('should handle unique filename generation', async () => {
      // Mock Date.now and Math.random for consistent testing
      const originalDateNow = Date.now;
      const originalMathRandom = Math.random;

      Date.now = jest.fn(() => 1640995200000); // Fixed timestamp
      Math.random = jest.fn(() => 0.5); // Fixed random value

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: true,
          json: async () => ({ url: 'https://example.com/unique-image.jpg' }),
        })
      );

      const { result } = renderHook(() => useMediaUpload(defaultProps));
      const mockFile = createMockFile('test.jpg', 'image/jpeg');
      const mockEvent = createMockInputEvent([mockFile]);

      await act(async () => {
        await result.current.handleImageUpload(mockEvent);
      });

      // Check that fetch was called and a unique MediaItem ID was generated
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockOnMediaUpdate).toHaveBeenCalledWith([
        expect.objectContaining({
          id: expect.stringMatching(/^temp-media--1640995200000-/),
          type: 'image',
          url: 'https://example.com/unique-image.jpg'
        })
      ]);

      // Restore original functions
      Date.now = originalDateNow;
      Math.random = originalMathRandom;
    });
  });

  describe('Configuration Options', () => {
    it('should respect enableYoutube: false configuration', () => {
      const { result } = renderHook(() => useMediaUpload({
        ...defaultProps,
        config: { enableYoutube: false }
      }));

      // Set a YouTube URL
      act(() => {
        result.current.setYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      });

      // Try to add YouTube video
      act(() => {
        result.current.handleYouTubeAdd();
      });

      expect(result.current.uploadError).toBe('Aggiunta video YouTube non abilitata per questo contesto');
      expect(mockOnMediaUpdate).not.toHaveBeenCalled();
    });


    it('should respect custom maxImageSize configuration', async () => {
      const { result } = renderHook(() => useMediaUpload({
        ...defaultProps,
        config: { maxImageSize: 2 } // 2MB limit
      }));

      // Create a file larger than 2MB
      const largeFile = createMockFile('large.jpg', 'image/jpeg', 3 * 1024 * 1024);
      const event = createMockInputEvent([largeFile]);

      await act(async () => {
        await result.current.handleImageUpload(event);
      });

      expect(result.current.uploadError).toBe('large.jpg è troppo grande (max 2MB)');
      expect(mockOnMediaUpdate).not.toHaveBeenCalled();
    });

    it('should respect maxImageCount configuration', async () => {
      const existingMedia = [
        { id: '1', type: 'image' as const, url: 'test1.jpg', caption: '' },
        { id: '2', type: 'image' as const, url: 'test2.jpg', caption: '' }
      ];

      const { result } = renderHook(() => useMediaUpload({
        ...defaultProps,
        currentMedia: existingMedia,
        config: { maxImageCount: 2 }
      }));

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: true,
          json: async () => ({ url: 'https://example.com/new-image.jpg' }),
        })
      );

      const file = createMockFile('new.jpg', 'image/jpeg');
      const event = createMockInputEvent([file]);

      await act(async () => {
        await result.current.handleImageUpload(event);
      });

      expect(result.current.uploadError).toBe('Puoi caricare massimo 2 immagini');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should use default configuration when config is empty', () => {
      const { result } = renderHook(() => useMediaUpload({
        ...defaultProps,
        config: {}
      }));

      // Test that YouTube is enabled by default
      act(() => {
        result.current.setYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      });

      act(() => {
        result.current.handleYouTubeAdd();
      });

      expect(result.current.uploadError).toBeNull();
      expect(mockOnMediaUpdate).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'video',
          url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        })
      ]);
    });

  });
});