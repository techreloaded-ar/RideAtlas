import React from 'react';

// Mock Next.js modules
export const mockNextAuth = {
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => ({
    data: null,
    status: 'unauthenticated' as const
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
};

export const mockNextRouter = {
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
};

export const mockNextNavigation = {
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
};

export const mockNextImage = {
  __esModule: true,
  default: (props: React.ComponentProps<'img'>) => {
    const { src, alt, ...otherProps } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { src, alt, ...otherProps });
  },
};

// Mock fetch globalmente
export const mockFetch = jest.fn();

// Funzione per setup dei mock globali
export const setupMocks = () => {
  // Mock Next.js modules
  jest.mock('next-auth/react', () => mockNextAuth);
  jest.mock('next/navigation', () => mockNextNavigation);
  jest.mock('next/router', () => mockNextRouter);
  jest.mock('next/image', () => mockNextImage);
  
  // Mock PurchaseService
  jest.mock('@/lib/purchaseService', () => ({
    PurchaseService: mockPurchaseService
  }));
  
  // Mock Prisma
  jest.mock('@/lib/prisma', () => ({
    prisma: mockPrisma
  }));
  
  // Mock fetch
  global.fetch = mockFetch;
  
  // Mock environment variables
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  process.env.NEXTAUTH_SECRET = 'test-secret';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
};

// Mock PurchaseService
export const mockPurchaseService = {
  hasPurchasedTrip: jest.fn(),
  canAccessPremiumContent: jest.fn(),
  getUserPurchases: jest.fn(),
  getUserPurchasesWithTrips: jest.fn(),
  createPurchase: jest.fn(),
  completePurchase: jest.fn(),
  failPurchase: jest.fn(),
  getTripWithPurchaseInfo: jest.fn()
};

// Mock Prisma Client
export const mockPrisma = {
  trip: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  tripPurchase: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  $disconnect: jest.fn()
};

// Reset function per i test
export const resetMocks = () => {
  jest.clearAllMocks();
  mockFetch.mockReset();
  
  // Reset PurchaseService mocks
  Object.values(mockPurchaseService).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
  
  // Reset Prisma mocks
  Object.values(mockPrisma).forEach(table => {
    if (typeof table === 'object') {
      Object.values(table).forEach(method => {
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    }
  });
};
