// src/tests/integration/media-upload.test.ts
import { auth } from '@/auth';
import { POST as uploadHandler } from '@/app/api/upload/route';
import { NextRequest } from 'next/server';
import { put } from '@vercel/blob';

// Mock delle dipendenze
jest.mock('@/auth', () => ({
  auth: jest.fn()
}));

jest.mock('@vercel/blob', () => ({
  put: jest.fn()
}));

// Mock per il NextRequest con FormData
const mockFormData = {
  get: jest.fn()
};

const createMockRequest = (file: File | null) => {
  mockFormData.get.mockReturnValue(file);
  
  return {
    formData: jest.fn().mockResolvedValue(mockFormData)
  } as unknown as NextRequest;
};

describe('API Media Upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock dell'autenticazione
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'user-123', name: 'Test User' }
    });
    
    // Mock della risposta di Vercel Blob
    (put as jest.Mock).mockResolvedValue({
      url: 'https://example.com/uploaded-image.jpg'
    });
  });
  
  it('deve respingere le richieste non autenticate', async () => {
    // Configura auth per simulare un utente non autenticato
    (auth as jest.Mock).mockResolvedValue(null);
    
    const request = createMockRequest(new File(['test'], 'test.jpg', { type: 'image/jpeg' }));
    const response = await uploadHandler(request);
    const body = await response.json();
    
    expect(response.status).toBe(401);
    expect(body).toHaveProperty('error', 'Non autorizzato');
  });
  
  it('deve respingere le richieste senza file', async () => {
    const request = createMockRequest(null);
    const response = await uploadHandler(request);
    const body = await response.json();
    
    expect(response.status).toBe(400);
    expect(body).toHaveProperty('error', 'Nessun file fornito');
  });
  
  it('deve respingere i tipi di file non supportati', async () => {
    const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const request = createMockRequest(invalidFile);
    const response = await uploadHandler(request);
    const body = await response.json();
    
    expect(response.status).toBe(400);
    expect(body).toHaveProperty('error', 'Tipo di file non supportato. Usa JPEG, PNG o WebP.');
  });
  
  it('deve respingere file troppo grandi', async () => {
    // Crea un file di dimensione maggiore di 5MB
    const largeContent = new ArrayBuffer(6 * 1024 * 1024); // 6MB
    const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
    
    const request = createMockRequest(largeFile);
    const response = await uploadHandler(request);
    const body = await response.json();
    
    expect(response.status).toBe(400);
    expect(body).toHaveProperty('error', 'File troppo grande. Massimo 5MB.');
  });
  
  it('deve gestire correttamente l\'upload di file validi', async () => {
    const validFile = new File(['valid content'], 'valid.jpg', { type: 'image/jpeg' });
    const request = createMockRequest(validFile);
    const response = await uploadHandler(request);
    const body = await response.json();
    
    expect(put).toHaveBeenCalledWith('valid.jpg', validFile, { access: 'public', addRandomSuffix: false });
    expect(response.status).toBe(200);
    expect(body).toHaveProperty('url', 'https://example.com/uploaded-image.jpg');
  });
  
  it('deve gestire gli errori durante l\'upload', async () => {
    // Simula un errore nell'upload
    (put as jest.Mock).mockRejectedValue(new Error('Upload failed'));
    
    const validFile = new File(['valid content'], 'valid.jpg', { type: 'image/jpeg' });
    const request = createMockRequest(validFile);
    
    // Verifica che l'errore venga gestito correttamente (restituendo un 500)
    const response = await uploadHandler(request);
    const body = await response.json();
    
    expect(response.status).toBe(500);
    expect(body).toHaveProperty('error', 'Errore interno del server');
  });
});
