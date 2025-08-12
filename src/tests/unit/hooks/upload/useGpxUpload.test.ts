/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useGpxUpload } from '@/hooks/upload/useGpxUpload';
import type { GpxFile } from '@/schemas/trip';

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Setup a global container for all tests
let globalContainer: HTMLDivElement;

describe('useGpxUpload Hook', () => {
  const mockGpxFile: GpxFile = {
    url: 'https://example.com/test.gpx',
    filename: 'test.gpx',
    waypoints: 100,
    distance: 25.5,
    elevationGain: 500,
    isValid: true
  };

  const mockOnGpxUpdate = jest.fn();

  beforeEach(() => {
    // Create a fresh container for each test
    globalContainer = document.createElement('div');
    globalContainer.setAttribute('data-testid', 'gpx-upload-container');
    document.body.appendChild(globalContainer);
    
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    // Cleanup container
    if (globalContainer && document.body.contains(globalContainer)) {
      document.body.removeChild(globalContainer);
    }
    
    jest.restoreAllMocks();
  });

  it('should return upload functions and state', () => {
    const { result } = renderHook(() => 
      useGpxUpload({ onGpxUpdate: mockOnGpxUpdate }), 
      { container: globalContainer }
    );

    expect(typeof result.current.handleGpxUpload).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadError).toBe(null);
  });

  it('should validate GPX file extension', async () => {
    const { result } = renderHook(() => 
      useGpxUpload({ onGpxUpdate: mockOnGpxUpdate }), 
      { container: globalContainer }
    );

    // Create a fake file with wrong extension
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    
    // Create a mock event
    const mockEvent = {
      target: { files: [mockFile], value: '' }
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleGpxUpload(mockEvent);
    });

    expect(result.current.uploadError).toBe('Seleziona solo file GPX');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockOnGpxUpdate).not.toHaveBeenCalled();
  });

  it('should validate file size limit', async () => {
    const { result } = renderHook(() => 
      useGpxUpload({ 
        onGpxUpdate: mockOnGpxUpdate,
        maxFileSizeMB: 5 
      }), 
      { container: globalContainer }
    );

    // Create a fake large file (6MB)
    const largeContent = 'x'.repeat(6 * 1024 * 1024);
    const mockFile = new File([largeContent], 'test.gpx', { type: 'application/gpx+xml' });
    
    const mockEvent = {
      target: { files: [mockFile], value: '' }
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleGpxUpload(mockEvent);
    });

    expect(result.current.uploadError).toBe('Il file deve essere massimo 5MB');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockOnGpxUpdate).not.toHaveBeenCalled();
  });

  it('should handle successful GPX upload', async () => {
    const { result } = renderHook(() => 
      useGpxUpload({ onGpxUpdate: mockOnGpxUpdate }), 
      { container: globalContainer }
    );

    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGpxFile,
    } as Response);

    // Create a valid GPX file
    const mockFile = new File(['<gpx></gpx>'], 'test.gpx', { type: 'application/gpx+xml' });
    const mockEvent = {
      target: { files: [mockFile], value: '' }
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleGpxUpload(mockEvent);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/upload/gpx', {
      method: 'POST',
      body: expect.any(FormData),
    });
    
    expect(result.current.uploadError).toBe(null);
    expect(result.current.isUploading).toBe(false);
    expect(mockOnGpxUpdate).toHaveBeenCalledWith(mockGpxFile);
  });

  it('should handle upload loading state', async () => {
    const { result } = renderHook(() => 
      useGpxUpload({ onGpxUpdate: mockOnGpxUpdate }), 
      { container: globalContainer }
    );

    // Mock delayed response
    let resolvePromise: (value: any) => void;
    const delayedPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    mockFetch.mockReturnValueOnce(delayedPromise as Promise<Response>);

    const mockFile = new File(['<gpx></gpx>'], 'test.gpx', { type: 'application/gpx+xml' });
    const mockEvent = {
      target: { files: [mockFile], value: '' }
    } as React.ChangeEvent<HTMLInputElement>;

    // Start upload
    act(() => {
      result.current.handleGpxUpload(mockEvent);
    });

    // Should be loading
    expect(result.current.isUploading).toBe(true);
    expect(result.current.uploadError).toBe(null);

    // Resolve the promise
    await act(async () => {
      resolvePromise!({
        ok: true,
        json: async () => mockGpxFile,
      } as Response);
    });

    // Should not be loading anymore
    expect(result.current.isUploading).toBe(false);
  });

  it('should handle API error responses', async () => {
    const { result } = renderHook(() => 
      useGpxUpload({ onGpxUpdate: mockOnGpxUpdate }), 
      { container: globalContainer }
    );

    // Mock API error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid GPX file' }),
    } as Response);

    const mockFile = new File(['<gpx></gpx>'], 'test.gpx', { type: 'application/gpx+xml' });
    const mockEvent = {
      target: { files: [mockFile], value: '' }
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleGpxUpload(mockEvent);
    });

    expect(result.current.uploadError).toBe('Invalid GPX file');
    expect(result.current.isUploading).toBe(false);
    expect(mockOnGpxUpdate).not.toHaveBeenCalled();
  });

  it('should handle network errors', async () => {
    const { result } = renderHook(() => 
      useGpxUpload({ onGpxUpdate: mockOnGpxUpdate }), 
      { container: globalContainer }
    );

    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const mockFile = new File(['<gpx></gpx>'], 'test.gpx', { type: 'application/gpx+xml' });
    const mockEvent = {
      target: { files: [mockFile], value: '' }
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleGpxUpload(mockEvent);
    });

    expect(result.current.uploadError).toBe('Network error');
    expect(result.current.isUploading).toBe(false);
    expect(mockOnGpxUpdate).not.toHaveBeenCalled();
  });

  it('should clear input value after successful upload', async () => {
    const { result } = renderHook(() => 
      useGpxUpload({ onGpxUpdate: mockOnGpxUpdate }), 
      { container: globalContainer }
    );

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGpxFile,
    } as Response);

    const mockFile = new File(['<gpx></gpx>'], 'test.gpx', { type: 'application/gpx+xml' });
    const mockEvent = {
      target: { files: [mockFile], value: 'test.gpx' }
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleGpxUpload(mockEvent);
    });

    // Input value should be cleared
    expect(mockEvent.target.value).toBe('');
  });

  it('should handle empty file selection', async () => {
    const { result } = renderHook(() => 
      useGpxUpload({ onGpxUpdate: mockOnGpxUpdate }), 
      { container: globalContainer }
    );

    // Mock event with no files
    const mockEvent = {
      target: { files: [], value: '' }
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleGpxUpload(mockEvent);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockOnGpxUpdate).not.toHaveBeenCalled();
    expect(result.current.uploadError).toBe(null);
  });

  it('should clear errors when clearError is called', async () => {
    const { result } = renderHook(() => 
      useGpxUpload({ onGpxUpdate: mockOnGpxUpdate }), 
      { container: globalContainer }
    );

    // First create an error
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    const mockEvent = {
      target: { files: [mockFile], value: '' }
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleGpxUpload(mockEvent);
    });

    expect(result.current.uploadError).toBe('Seleziona solo file GPX');

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.uploadError).toBe(null);
  });

  it('should use custom max file size when provided', async () => {
    const customMaxSize = 10;
    const { result } = renderHook(() => 
      useGpxUpload({ 
        onGpxUpdate: mockOnGpxUpdate,
        maxFileSizeMB: customMaxSize
      }), 
      { container: globalContainer }
    );

    // Create a file larger than custom limit but smaller than default
    const content = 'x'.repeat(15 * 1024 * 1024); // 15MB
    const mockFile = new File([content], 'test.gpx', { type: 'application/gpx+xml' });
    const mockEvent = {
      target: { files: [mockFile], value: '' }
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleGpxUpload(mockEvent);
    });

    expect(result.current.uploadError).toBe('Il file deve essere massimo 10MB');
  });

  it('should send FormData with correct fields', async () => {
    const { result } = renderHook(() => 
      useGpxUpload({ onGpxUpdate: mockOnGpxUpdate }), 
      { container: globalContainer }
    );

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGpxFile,
    } as Response);

    const mockFile = new File(['<gpx></gpx>'], 'test.gpx', { type: 'application/gpx+xml' });
    const mockEvent = {
      target: { files: [mockFile], value: '' }
    } as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleGpxUpload(mockEvent);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/upload/gpx', {
      method: 'POST',
      body: expect.any(FormData),
    });

    // Check that FormData was created with a file named 'gpx'
    const formData = (mockFetch.mock.calls[0][1] as { body: FormData }).body;
    const uploadedFile = formData.get('gpx') as File;
    
    expect(uploadedFile).toBeTruthy();
    expect(uploadedFile.size).toBe(mockFile.size);
    expect(uploadedFile.type).toBe(mockFile.type);
    expect(uploadedFile.name).toBeDefined();
  });
});