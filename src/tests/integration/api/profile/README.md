# Profile API Test Utilities

Questo modulo fornisce un set completo di utilities per testare l'API di aggiornamento del profilo utente, implementando pattern avanzati per migliorare la manutenibilità e ridurre la duplicazione del codice.

## Struttura dei File

```
src/tests/integration/api/profile/
├── types.ts              # Definizioni TypeScript
├── constants.ts          # Costanti di test
├── factory.ts            # Factory per dati di test
├── helpers.ts            # Helper functions
├── builder.ts            # Builder pattern per scenari complessi
├── index.ts              # Esportazioni centralizzate
├── update.test.ts        # Test principali refactorizzati
├── update-advanced.test.ts # Test avanzati con builder pattern
└── README.md             # Questa documentazione
```

## Pattern Implementati

### 1. Factory Pattern (`factory.ts`)

Crea oggetti di test standardizzati eliminando la duplicazione:

```typescript
// Prima (duplicazione)
const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  bio: null,
  email: 'test@example.com',
  socialLinks: null
};

// Dopo (factory)
const mockUser = ProfileTestDataFactory.createMockUser({
  name: 'Test User'
});
```

### 2. Helper Functions (`helpers.ts`)

Incapsula operazioni comuni di test:

```typescript
// Prima (codice ripetitivo)
const request = new NextRequest('http://localhost:3000/api/profile/update', {
  method: 'PUT',
  body: JSON.stringify(requestBody),
  headers: { 'Content-Type': 'application/json' }
});
const response = await PUT(request);
const data = await response.json();

// Dopo (helper)
const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(requestBody);
```

### 3. Builder Pattern (`builder.ts`)

Costruisce scenari di test complessi in modo fluido:

```typescript
const scenario = new ProfileUpdateTestBuilder()
  .withValidSocialLinks()
  .withUserData({ name: 'Advanced User', bio: 'Complex scenario' })
  .withoutAuthentication()
  .build();
```

### 4. Type Safety (`types.ts`)

Elimina l'uso di `any` con tipi specifici:

```typescript
// Prima
mockAuth.mockResolvedValue(mockSession as any);

// Dopo
const mockSession: MockSession = ProfileTestDataFactory.createMockSession();
mockAuth.mockResolvedValue(mockSession);
```

## Utilizzo

### Test Semplici

```typescript
import { ProfileTestHelpers, ProfileTestDataFactory } from './index';

it('should update profile successfully', async () => {
  const requestBody = ProfileTestDataFactory.createProfileUpdateRequest({
    socialLinks: ProfileTestDataFactory.createValidSocialLinks()
  });
  
  const mockUser = ProfileTestDataFactory.createMockUser({
    socialLinks: ProfileTestDataFactory.createValidSocialLinks()
  });
  
  ProfileTestHelpers.setupSuccessfulPrismaUpdate(mockUser);
  
  const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(requestBody);
  
  ProfileTestHelpers.expectSuccessfulUpdate(response, data, mockUser);
});
```

### Test Parametrizzati

```typescript
import { TEST_CONSTANTS } from './constants';

describe('Invalid Social Links', () => {
  test.each(TEST_CONSTANTS.INVALID_SOCIAL_LINKS_SCENARIOS)(
    'should reject $name',
    async ({ socialLinks }) => {
      const requestBody = ProfileTestDataFactory.createProfileUpdateRequest({
        socialLinks
      });

      const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(requestBody);

      ProfileTestHelpers.expectSocialLinksValidationError(response, data);
    }
  );
});
```

### Test con Builder Pattern

```typescript
import { ProfileUpdateTestBuilder } from './builder';

it('should handle complex scenario', async () => {
  const scenario = new ProfileUpdateTestBuilder()
    .withValidSocialLinks()
    .withUserData({ name: 'Complex User' })
    .withoutAuthentication()
    .build();

  // Test logic here
});
```

## Vantaggi

### 1. **Riduzione Duplicazione**
- Factory elimina la creazione ripetitiva di oggetti mock
- Helper functions riducono il boilerplate delle richieste HTTP
- Costanti centralizzate evitano valori hardcoded

### 2. **Type Safety**
- Eliminazione completa dell'uso di `any`
- Interfacce TypeScript per tutti gli oggetti di test
- Autocompletamento e controllo dei tipi in fase di sviluppo

### 3. **Manutenibilità**
- Modifiche ai dati di test in un solo posto (factory)
- Helper functions facilitano l'aggiornamento della logica di test
- Pattern builder per scenari complessi riutilizzabili

### 4. **Leggibilità**
- Test più concisi e focalizzati sulla logica di business
- Nomi descrittivi per helper e factory methods
- Separazione chiara tra setup, esecuzione e assertion

### 5. **Scalabilità**
- Pattern riutilizzabili per altri endpoint API
- Struttura modulare facilmente estendibile
- Test parametrizzati per coverage completa

## Migrazione da Test Esistenti

Per migrare test esistenti:

1. **Sostituire oggetti mock** con factory methods
2. **Estrarre richieste HTTP** in helper functions
3. **Utilizzare costanti** invece di valori hardcoded
4. **Aggiungere tipi TypeScript** per eliminare `any`
5. **Considerare builder pattern** per scenari complessi

## Best Practices

1. **Usa sempre la factory** per creare oggetti di test
2. **Preferisci helper functions** per operazioni comuni
3. **Implementa test parametrizzati** per scenari simili
4. **Mantieni i test focalizzati** su un singolo aspetto
5. **Documenta scenari complessi** con nomi descrittivi

## Estensioni Future

- **Performance testing utilities** per test di carico
- **Visual regression testing** per componenti UI
- **API contract testing** con schema validation
- **Integration con CI/CD** per reporting automatico