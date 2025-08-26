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
// Utility per i test delle mappe
export const createMockGPXTrack = (pointsCount: number = 5, color?: string) => ({
  name: `Test Track ${Math.random()}`,
  color: color || '#3b82f6',
  points: Array.from({ length: pointsCount }, (_, i) => ({
    lat: 45.0 + (i * 0.001),
    lng: 9.0 + (i * 0.001),
    elevation: 100 + i * 10,
    time: new Date(Date.now() + i * 1000).toISOString()
  }))
})

export const createMockGPXRoute = (pointsCount: number = 3, color?: string) => ({
  name: `Test Route ${Math.random()}`,
  color: color || '#dc2626',
  points: Array.from({ length: pointsCount }, (_, i) => ({
    lat: 45.1 + (i * 0.002),
    lng: 9.1 + (i * 0.002),
    elevation: 200 + i * 20
  }))
})

export const createMockGPXWaypoint = (name?: string) => ({
  name: name || `Waypoint ${Math.random()}`,
  lat: 45.05 + Math.random() * 0.01,
  lng: 9.05 + Math.random() * 0.01,
  elevation: 150 + Math.random() * 100
})

// Utility per simulare eventi DOM
export const simulateResize = (element: HTMLElement, width: number = 800, height: number = 600) => {
  Object.defineProperty(element, 'getBoundingClientRect', {
    value: () => ({
      width,
      height,
      top: 0,
      left: 0,
      bottom: height,
      right: width
    })
  })
  
  // Trigger resize event
  const resizeEvent = new Event('resize')
  window.dispatchEvent(resizeEvent)
}

// Utility per aspettare che tutti i timer siano completati
export const flushPromises = () => new Promise(resolve => setImmediate(resolve))

// Utility per verificare chiamate Leaflet
export const expectLeafletMapCreated = (container: HTMLElement) => {
  expect(container.id).toMatch(/^leaflet-map-\d+-\d+$/)
  expect(container).toHaveClass('w-full', 'h-full')
  expect(container).toHaveStyle({ minHeight: '200px' })
}