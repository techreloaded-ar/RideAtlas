import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import 'whatwg-fetch';

// Setup globals per Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;

// Mock setImmediate per nodemailer
global.setImmediate = global.setImmediate || ((fn: (...args: unknown[]) => void, ...args: unknown[]) => setTimeout(fn, 0, ...args));

// Mock crypto per Node.js
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => arr.fill(1),
    randomUUID: () => 'test-uuid-1234',
  },
  writable: true,
});

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => {
      const response = {
        json: async () => data,
        status: init?.status || 200,
        ok: (init?.status || 200) < 400,
        headers: new Map(),
        text: async () => JSON.stringify(data),
      };
      return response;
    },
    redirect: (url: string, status?: number) => ({
      json: async () => ({ redirect: url }),
      status: status || 302,
      ok: false,
      headers: new Map(),
      text: async () => JSON.stringify({ redirect: url }),
    }),
  },
}));

// Mock next-auth globalmente
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({
    data: null,
    status: 'unauthenticated'
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getProviders: jest.fn(() => Promise.resolve({
    google: {
      id: 'google',
      name: 'Google',
      type: 'oauth',
      signinUrl: '/api/auth/signin/google',
      callbackUrl: '/api/auth/callback/google'
    },
    credentials: {
      id: 'credentials',
      name: 'credentials',
      type: 'credentials',
      signinUrl: '/api/auth/signin/credentials',
      callbackUrl: '/api/auth/callback/credentials'
    }
  }))
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    entries: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock console per test più puliti (opzionale)
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  // Silenzia solo alcuni warning specifici durante i test
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning: An update to') ||
       message.includes('Warning: ReactDOM.render') ||
       message.includes('⚠️  Configurazione email non completa') ||
       message.includes('❌ Errore invio email:'))
    ) {
      return;
    }
    originalError(...args);
  });

  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning:') ||
       message.includes('⚠️  Variabili email mancanti:'))
    ) {
      return;
    }
    originalWarn(...args);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});
