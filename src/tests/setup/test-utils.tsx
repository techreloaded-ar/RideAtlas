import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Mock SessionProvider direttamente qui
const MockSessionProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Provider personalizzato per i test
const AllTheProviders = ({ 
  children
}: { 
  children: React.ReactNode;
}) => {
  return (
    <MockSessionProvider>
      {children}
    </MockSessionProvider>
  );
};

// Custom render con provider
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  const renderOptions = options || {};
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders>{children}</AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Helper functions per i test
export const createMockSession = (overrides = {}) => ({
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
    emailVerified: new Date(),
    ...overrides
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
});

export const waitForAsync = (ms = 0) => 
  new Promise(resolve => setTimeout(resolve, ms));
