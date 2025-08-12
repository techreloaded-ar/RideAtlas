import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import 'whatwg-fetch';

// Setup globals per Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;

// Mock File API per Node.js test environment
class MockFile extends Blob {
  name: string;
  lastModified: number;
  private content: string;

  constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
    super(fileBits, options);
    this.name = fileName;
    this.lastModified = options?.lastModified || Date.now();
      // Store the content as string for easy access
    if (fileBits.length > 0 && typeof fileBits[0] === 'string') {
      this.content = fileBits[0];
    } else if (fileBits.length > 0) {
      this.content = String(fileBits[0]);
    } else {
      this.content = '';
    }
  }
  async text(): Promise<string> {
    return this.content;
  }
}

// Make File available globally in test environment
global.File = MockFile as any;

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

// Mock NextResponse and NextRequest
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
  NextRequest: jest.fn().mockImplementation((url: string, init?: RequestInit) => {
    const parsedUrl = new URL(url);
    return {
      url,
      method: init?.method || 'GET',
      headers: new Map(Object.entries(init?.headers || {})),
      body: init?.body || null,
      json: async () => (init?.body ? JSON.parse(init.body as string) : {}),
      text: async () => init?.body as string || '',
      nextUrl: {
        searchParams: parsedUrl.searchParams,
        pathname: parsedUrl.pathname,
        search: parsedUrl.search,
        href: parsedUrl.href,
      },
    };
  }),
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

// Mock Prisma Client
const mockPrisma: any = {
  trip: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn()
  },
  tripPurchase: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn()
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn()
  },
  account: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  session: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  verificationToken: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  emailVerificationToken: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  tripPurchaseTransaction: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  $disconnect: jest.fn(),
  $connect: jest.fn(),
  $transaction: jest.fn((callback) => callback(mockPrisma))
};

// Make mockPrisma available globally for tests
if (typeof global !== 'undefined') {
  (global as any).mockPrisma = mockPrisma;
}

jest.mock('@/lib/core/prisma', () => ({
  prisma: mockPrisma
}));

// Mock PurchaseService will be available globally but unit tests can override it
const mockPurchaseService = {
  hasPurchasedTrip: jest.fn(),
  canAccessPremiumContent: jest.fn(),
  getUserPurchases: jest.fn(),
  getUserPurchasesWithTrips: jest.fn(),
  createPurchase: jest.fn(),
  completePurchase: jest.fn(),
  failPurchase: jest.fn(),
  getTripWithPurchaseInfo: jest.fn()
};

// Make mockPurchaseService available globally for integration tests
if (typeof global !== 'undefined') {
  (global as any).mockPurchaseService = mockPurchaseService;
}

// Only mock PurchaseService for integration tests, not unit tests
// Unit tests will mock Prisma directly and test the real PurchaseService

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(() => Promise.resolve(null))
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
