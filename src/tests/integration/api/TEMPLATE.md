# Template per Test di Integrazione API

Questo template fornisce una struttura standardizzata per creare test di integrazione per nuovi endpoint API, basata sui pattern implementati per l'API di aggiornamento profilo.

## Struttura Directory

Per ogni nuovo endpoint API, crea una directory con questa struttura:

```
src/tests/integration/api/{endpoint-name}/
├── types.ts              # Definizioni TypeScript
├── constants.ts          # Costanti di test
├── factory.ts            # Factory per dati di test
├── helpers.ts            # Helper functions
├── builder.ts            # Builder pattern (opzionale per scenari complessi)
├── index.ts              # Esportazioni centralizzate
├── {endpoint}.test.ts    # Test principali
├── {endpoint}-advanced.test.ts # Test avanzati (opzionale)
└── README.md             # Documentazione specifica
```

## 1. types.ts - Template

```typescript
/**
 * TypeScript type definitions for {endpoint-name} integration tests
 */

export interface MockSession {
  user: {
    id: string;
    // Altri campi specifici se necessari
  };
}

export interface Mock{EntityName} {
  id: string;
  // Definisci tutti i campi dell'entità
  createdAt?: Date;
  updatedAt?: Date;
}

export interface {EndpointName}Request {
  // Definisci i campi della richiesta
}

export interface ApiResponse {
  success?: boolean;
  error?: string;
  details?: string[];
  data?: Mock{EntityName};
  // Altri campi specifici della risposta
}

export interface TestScenario {
  name: string;
  requestBody: {EndpointName}Request;
  expectedStatus: number;
  shouldSucceed: boolean;
  mockResponse?: Mock{EntityName};
}
```

## 2. constants.ts - Template

```typescript
/**
 * Test constants for {endpoint-name} integration tests
 */

export const TEST_CONSTANTS = {
  MOCK_USER_ID: 'test-user-id',
  MOCK_ENTITY_ID: 'test-entity-id',
  API_ENDPOINT: 'http://localhost:3000/api/{endpoint-path}',
  
  ERROR_MESSAGES: {
    UNAUTHORIZED: 'Non autorizzato',
    INVALID_DATA: 'Dati non validi',
    NOT_FOUND: 'Risorsa non trovata',
    SERVER_ERROR: 'Errore interno del server'
  },

  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  },

  // Aggiungi costanti specifiche per l'endpoint
  VALID_REQUEST_DATA: {
    // Dati di esempio validi
  },

  INVALID_REQUEST_SCENARIOS: [
    {
      name: 'missing required field',
      requestData: {
        // Dati con campo mancante
      }
    },
    {
      name: 'invalid field format',
      requestData: {
        // Dati con formato non valido
      }
    }
  ]
} as const;
```

## 3. factory.ts - Template

```typescript
/**
 * Test data factory for {endpoint-name} integration tests
 */

import { Mock{EntityName}, MockSession, {EndpointName}Request } from './types';
import { TEST_CONSTANTS } from './constants';

export class {EndpointName}TestDataFactory {
  /**
   * Creates a mock entity with optional overrides
   */
  static createMock{EntityName}(overrides: Partial<Mock{EntityName}> = {}): Mock{EntityName} {
    return {
      id: TEST_CONSTANTS.MOCK_ENTITY_ID,
      // Campi di default
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Creates a mock session for authenticated requests
   */
  static createMockSession(userId: string = TEST_CONSTANTS.MOCK_USER_ID): MockSession {
    return {
      user: { id: userId }
    };
  }

  /**
   * Creates a valid request object
   */
  static createValidRequest(overrides: Partial<{EndpointName}Request> = {}): {EndpointName}Request {
    return {
      // Campi di default validi
      ...TEST_CONSTANTS.VALID_REQUEST_DATA,
      ...overrides
    };
  }

  /**
   * Creates invalid request data for testing validation
   */
  static createInvalidRequest(scenario: string): {EndpointName}Request {
    const invalidScenario = TEST_CONSTANTS.INVALID_REQUEST_SCENARIOS.find(s => s.name === scenario);
    if (!invalidScenario) {
      throw new Error(`Invalid scenario: ${scenario}`);
    }
    return invalidScenario.requestData as {EndpointName}Request;
  }

  // Aggiungi altri metodi factory specifici per l'endpoint
}
```

## 4. helpers.ts - Template

```typescript
/**
 * Helper functions for {endpoint-name} integration tests
 */

import { NextRequest } from 'next/server';
import { {HTTP_METHOD} } from '@/app/api/{endpoint-path}/route';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';
import { ApiResponse, Mock{EntityName}, {EndpointName}Request } from './types';
import { TEST_CONSTANTS } from './constants';
import { {EndpointName}TestDataFactory } from './factory';

export class {EndpointName}TestHelpers {
  /**
   * Makes a request to the endpoint with optional authentication
   */
  static async makeRequest(
    body: {EndpointName}Request | string,
    options: { 
      authenticated?: boolean;
      userId?: string;
      method?: string;
    } = {}
  ): Promise<{ response: Response; data: ApiResponse }> {
    
    const { 
      authenticated = true, 
      userId = TEST_CONSTANTS.MOCK_USER_ID,
      method = '{HTTP_METHOD}'
    } = options;

    // Get mock functions
    const mockAuth = auth as jest.MockedFunction<typeof auth>;

    // Setup authentication mock
    if (authenticated) {
      const mockSession = {EndpointName}TestDataFactory.createMockSession(userId);
      mockAuth.mockResolvedValue(mockSession as any);
    } else {
      mockAuth.mockResolvedValue(null);
    }

    // Create request
    const requestBody = typeof body === 'string' ? body : JSON.stringify(body);
    const request = new NextRequest(TEST_CONSTANTS.API_ENDPOINT, {
      method,
      body: requestBody,
      headers: { 'Content-Type': 'application/json' }
    });

    // Execute request
    const response = await {HTTP_METHOD}(request);
    const data = await response.json();
    
    return { response, data };
  }

  /**
   * Sets up Prisma mock for successful operation
   */
  static setupSuccessfulPrismaOperation(mockEntity: Mock{EntityName}): void {
    const mockPrismaOperation = prisma.{entityName}.{operation} as jest.MockedFunction<typeof prisma.{entityName}.{operation}>;
    mockPrismaOperation.mockResolvedValue(mockEntity as any);
  }

  /**
   * Sets up Prisma mock to throw an error
   */
  static setupFailedPrismaOperation(error: Error = new Error('Database error')): void {
    const mockPrismaOperation = prisma.{entityName}.{operation} as jest.MockedFunction<typeof prisma.{entityName}.{operation}>;
    mockPrismaOperation.mockRejectedValue(error);
  }

  /**
   * Expects a successful response
   */
  static expectSuccessfulResponse(
    response: Response, 
    data: ApiResponse, 
    expectedEntity: Mock{EntityName}
  ): void {
    expect(response.status).toBe(TEST_CONSTANTS.HTTP_STATUS.OK);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(expectedEntity);
  }

  /**
   * Expects a validation error response
   */
  static expectValidationError(response: Response, data: ApiResponse): void {
    expect(response.status).toBe(TEST_CONSTANTS.HTTP_STATUS.BAD_REQUEST);
    expect(data.error).toBe(TEST_CONSTANTS.ERROR_MESSAGES.INVALID_DATA);
    expect(data.details).toBeInstanceOf(Array);
  }

  /**
   * Expects an unauthorized error response
   */
  static expectUnauthorizedError(response: Response, data: ApiResponse): void {
    expect(response.status).toBe(TEST_CONSTANTS.HTTP_STATUS.UNAUTHORIZED);
    expect(data.error).toBe(TEST_CONSTANTS.ERROR_MESSAGES.UNAUTHORIZED);
  }

  /**
   * Expects a server error response
   */
  static expectServerError(response: Response, data: ApiResponse): void {
    expect(response.status).toBe(TEST_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(data.error).toBe(TEST_CONSTANTS.ERROR_MESSAGES.SERVER_ERROR);
  }

  /**
   * Clears all mocks - should be called in beforeEach
   */
  static clearAllMocks(): void {
    jest.clearAllMocks();
  }
}
```

## 5. Test File Template

```typescript
/**
 * Integration tests for {endpoint-name} API endpoint
 */

import { NextRequest } from 'next/server';
import { {HTTP_METHOD} } from '@/app/api/{endpoint-path}/route';
import { prisma } from '@/lib/core/prisma';
import { auth } from '@/auth';
import { {EndpointName}TestHelpers } from './helpers';
import { {EndpointName}TestDataFactory } from './factory';
import { TEST_CONSTANTS } from './constants';

// Mock the auth function
jest.mock('@/auth');
const mockAuth = auth as jest.MockedFunction<typeof auth>;

// Mock Prisma
jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    {entityName}: {
      {operation}: jest.fn(),
    },
  },
}));

describe('/api/{endpoint-path}', () => {
  beforeEach(() => {
    {EndpointName}TestHelpers.clearAllMocks();
  });

  describe('Successful Operations', () => {
    it('should handle valid request successfully', async () => {
      const requestBody = {EndpointName}TestDataFactory.createValidRequest();
      const mockEntity = {EndpointName}TestDataFactory.createMock{EntityName}();

      {EndpointName}TestHelpers.setupSuccessfulPrismaOperation(mockEntity);

      const { response, data } = await {EndpointName}TestHelpers.makeRequest(requestBody);

      {EndpointName}TestHelpers.expectSuccessfulResponse(response, data, mockEntity);
    });
  });

  describe('Validation', () => {
    test.each(TEST_CONSTANTS.INVALID_REQUEST_SCENARIOS)(
      'should reject $name',
      async ({ name, requestData }) => {
        const { response, data } = await {EndpointName}TestHelpers.makeRequest(requestData as any);

        {EndpointName}TestHelpers.expectValidationError(response, data);
      }
    );
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      const requestBody = {EndpointName}TestDataFactory.createValidRequest();

      const { response, data } = await {EndpointName}TestHelpers.makeRequest(
        requestBody,
        { authenticated: false }
      );

      {EndpointName}TestHelpers.expectUnauthorizedError(response, data);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when database operation fails', async () => {
      const requestBody = {EndpointName}TestDataFactory.createValidRequest();
      
      {EndpointName}TestHelpers.setupFailedPrismaOperation(new Error('Database error'));

      const { response, data } = await {EndpointName}TestHelpers.makeRequest(requestBody);

      {EndpointName}TestHelpers.expectServerError(response, data);
    });
  });
});
```

## 6. index.ts - Template

```typescript
/**
 * {EndpointName} API test utilities - centralized exports
 */

export * from './types';
export * from './constants';
export * from './factory';
export * from './helpers';

// Re-export commonly used items for convenience
export { {EndpointName}TestHelpers as Helpers } from './helpers';
export { {EndpointName}TestDataFactory as Factory } from './factory';
export { TEST_CONSTANTS as Constants } from './constants';
```

## Istruzioni per l'Uso

1. **Copia il template** nella directory appropriata
2. **Sostituisci i placeholder**:
   - `{endpoint-name}` → nome dell'endpoint (es. 'trips', 'users')
   - `{EndpointName}` → nome in PascalCase (es. 'Trip', 'User')
   - `{EntityName}` → nome dell'entità (es. 'Trip', 'User')
   - `{entityName}` → nome dell'entità in camelCase (es. 'trip', 'user')
   - `{HTTP_METHOD}` → metodo HTTP (GET, POST, PUT, DELETE)
   - `{endpoint-path}` → percorso dell'endpoint
   - `{operation}` → operazione Prisma (create, update, delete, findMany)

3. **Personalizza i tipi** in base ai campi specifici dell'entità
4. **Aggiungi costanti specifiche** per l'endpoint
5. **Implementa factory methods** per i dati di test
6. **Adatta gli helper** alle operazioni specifiche
7. **Scrivi i test** seguendo i pattern stabiliti

## Vantaggi del Template

- **Consistenza** tra tutti gli endpoint API
- **Velocità di sviluppo** per nuovi test
- **Manutenibilità** attraverso pattern standardizzati
- **Qualità** garantita dai pattern testati
- **Scalabilità** per progetti di grandi dimensioni

Questo template assicura che tutti i test di integrazione API seguano gli stessi standard di qualità e manutenibilità implementati per l'endpoint di aggiornamento profilo.