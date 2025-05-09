// Importa jest-dom per estendere le asserzioni di Jest
import '@testing-library/jest-dom';

// Mock per next/router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: jest.fn().mockReturnValue('/'),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
}));

// Mock per le variabili d'ambiente
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-publishable-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-mapbox-token';