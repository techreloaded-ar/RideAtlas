# Esempi di Utilizzo dei Pattern di Test

Questo documento fornisce esempi pratici su come utilizzare i pattern implementati per creare test efficaci e manutenibili.

## 1. Test Semplice con Factory e Helpers

```typescript
import { ProfileTestHelpers, ProfileTestDataFactory, TEST_CONSTANTS } from './index';

describe('Profile Update API', () => {
  beforeEach(() => {
    ProfileTestHelpers.clearAllMocks();
  });

  it('should update user profile successfully', async () => {
    // Arrange - Usa la factory per creare dati di test
    const requestBody = ProfileTestDataFactory.createProfileUpdateRequest({
      name: 'John Doe',
      bio: 'Software Developer',
      socialLinks: ProfileTestDataFactory.createValidSocialLinks()
    });

    const expectedUser = ProfileTestDataFactory.createMockUser({
      name: 'John Doe',
      bio: 'Software Developer',
      socialLinks: ProfileTestDataFactory.createValidSocialLinks()
    });

    // Setup mock
    ProfileTestHelpers.setupSuccessfulPrismaUpdate(expectedUser);

    // Act - Usa helper per fare la richiesta
    const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(requestBody);

    // Assert - Usa helper per le verifiche
    ProfileTestHelpers.expectSuccessfulUpdate(response, data, expectedUser);
    ProfileTestHelpers.expectPrismaUpdateCalledWith(TEST_CONSTANTS.MOCK_USER_ID, {
      name: 'John Doe',
      bio: 'Software Developer',
      socialLinks: ProfileTestDataFactory.createValidSocialLinks()
    });
  });
});
```

## 2. Test Parametrizzati per Scenari Multipli

```typescript
import { TEST_CONSTANTS } from './constants';

describe('Social Links Validation', () => {
  // Test parametrizzato per diversi tipi di link non validi
  test.each(TEST_CONSTANTS.INVALID_SOCIAL_LINKS_SCENARIOS)(
    'should reject $name',
    async ({ socialLinks }) => {
      const requestBody = ProfileTestDataFactory.createProfileUpdateRequest({
        socialLinks
      });

      const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(requestBody);

      ProfileTestHelpers.expectSocialLinksValidationError(response, data);
      ProfileTestHelpers.expectPrismaUpdateNotCalled();
    }
  );

  // Test parametrizzato per diversi stati di autenticazione
  const authScenarios = [
    { name: 'unauthenticated user', authenticated: false, expectedStatus: 401 },
    { name: 'authenticated user', authenticated: true, expectedStatus: 200 }
  ];

  test.each(authScenarios)(
    'should handle $name correctly',
    async ({ authenticated, expectedStatus }) => {
      const requestBody = ProfileTestDataFactory.createProfileUpdateRequest();
      
      if (expectedStatus === 200) {
        const mockUser = ProfileTestDataFactory.createMockUser();
        ProfileTestHelpers.setupSuccessfulPrismaUpdate(mockUser);
      }

      const { response } = await ProfileTestHelpers.makeProfileUpdateRequest(
        requestBody,
        { authenticated }
      );

      expect(response.status).toBe(expectedStatus);
    }
  );
});
```

## 3. Test Complessi con Builder Pattern

```typescript
import { ProfileUpdateTestBuilder } from './builder';

describe('Complex Profile Update Scenarios', () => {
  it('should handle user with mixed social links and custom bio', async () => {
    // Usa il builder per creare scenari complessi
    const scenario = new ProfileUpdateTestBuilder()
      .withName('complex user scenario')
      .withUserData({
        name: 'Maria Rossi',
        bio: 'Motorcycle enthusiast and travel blogger'
      })
      .withRequestBody({
        socialLinks: {
          instagram: 'https://instagram.com/maria_rides',
          website: 'https://mariarides.com',
          youtube: '' // Link vuoto - dovrebbe essere rimosso
        }
      })
      .build();

    if (scenario.mockResponse) {
      ProfileTestHelpers.setupSuccessfulPrismaUpdate(scenario.mockResponse);
    }

    const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(
      scenario.requestBody
    );

    ProfileTestHelpers.expectSuccessfulUpdate(response, data, scenario.mockResponse!);
  });

  it('should handle error scenarios gracefully', async () => {
    const scenario = new ProfileUpdateTestBuilder()
      .withDatabaseError()
      .build();

    ProfileTestHelpers.setupFailedPrismaUpdate(new Error('Database connection failed'));

    const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(
      scenario.requestBody
    );

    ProfileTestHelpers.expectServerError(response, data);
  });
});
```

## 4. Test di Performance e Carico

```typescript
describe('Performance Tests', () => {
  it('should handle concurrent profile updates', async () => {
    const numberOfRequests = 10;
    
    // Crea scenari multipli
    const scenarios = Array.from({ length: numberOfRequests }, (_, i) =>
      new ProfileUpdateTestBuilder()
        .withUserData({
          name: `User ${i}`,
          bio: `Bio for user ${i}`
        })
        .build()
    );

    // Setup mocks per tutti gli scenari
    scenarios.forEach((scenario, index) => {
      if (scenario.mockResponse) {
        ProfileTestHelpers.setupSuccessfulPrismaUpdate(scenario.mockResponse);
      }
    });

    // Esegui richieste concorrenti
    const promises = scenarios.map(async (scenario, index) => {
      return ProfileTestHelpers.makeProfileUpdateRequest(
        scenario.requestBody,
        { userId: `user-${index}` }
      );
    });

    const results = await Promise.all(promises);

    // Verifica che tutte le richieste siano riuscite
    results.forEach(({ response }) => {
      expect(response.status).toBe(200);
    });
  });
});
```

## 5. Test di Edge Cases

```typescript
describe('Edge Cases', () => {
  it('should handle user with extremely long valid bio', async () => {
    const maxBio = 'a'.repeat(200); // Esattamente al limite
    
    const scenario = new ProfileUpdateTestBuilder()
      .withUserData({ bio: maxBio })
      .build();

    if (scenario.mockResponse) {
      ProfileTestHelpers.setupSuccessfulPrismaUpdate(scenario.mockResponse);
    }

    const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(
      scenario.requestBody
    );

    ProfileTestHelpers.expectSuccessfulUpdate(response, data, scenario.mockResponse!);
  });

  it('should handle special characters in social links', async () => {
    const specialCharLinks = {
      instagram: 'https://instagram.com/user_with-special.chars',
      website: 'https://my-website.co.uk/path?param=value&other=123'
    };

    const requestBody = ProfileTestDataFactory.createProfileUpdateRequest({
      socialLinks: specialCharLinks
    });

    const mockUser = ProfileTestDataFactory.createMockUser({
      socialLinks: specialCharLinks
    });

    ProfileTestHelpers.setupSuccessfulPrismaUpdate(mockUser);

    const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(requestBody);

    ProfileTestHelpers.expectSuccessfulUpdate(response, data, mockUser);
  });
});
```

## 6. Test di Integrazione con Validazione Custom

```typescript
describe('Custom Validation Integration', () => {
  it('should validate social links according to platform rules', async () => {
    const platformSpecificTests = [
      {
        platform: 'instagram',
        validUrl: 'https://instagram.com/validuser',
        invalidUrl: 'https://facebook.com/invalidplatform'
      },
      {
        platform: 'youtube',
        validUrl: 'https://youtube.com/@validchannel',
        invalidUrl: 'https://youtube.com/invalidformat'
      }
    ];

    for (const { platform, validUrl, invalidUrl } of platformSpecificTests) {
      // Test URL valido
      const validRequest = ProfileTestDataFactory.createProfileUpdateRequest({
        socialLinks: { [platform]: validUrl }
      });

      const mockUser = ProfileTestDataFactory.createMockUser({
        socialLinks: { [platform]: validUrl }
      });

      ProfileTestHelpers.setupSuccessfulPrismaUpdate(mockUser);

      const { response: validResponse } = await ProfileTestHelpers.makeProfileUpdateRequest(validRequest);
      expect(validResponse.status).toBe(200);

      // Test URL non valido
      const invalidRequest = ProfileTestDataFactory.createProfileUpdateRequest({
        socialLinks: { [platform]: invalidUrl }
      });

      const { response: invalidResponse, data: invalidData } = await ProfileTestHelpers.makeProfileUpdateRequest(invalidRequest);
      ProfileTestHelpers.expectSocialLinksValidationError(invalidResponse, invalidData);
    }
  });
});
```

## 7. Test con Setup e Teardown Personalizzati

```typescript
describe('Profile Update with Custom Setup', () => {
  let testUser: MockUser;

  beforeEach(() => {
    ProfileTestHelpers.clearAllMocks();
    
    // Setup personalizzato per ogni test
    testUser = ProfileTestDataFactory.createMockUser({
      name: 'Test User',
      email: 'test@rideatlas.com'
    });
  });

  afterEach(() => {
    // Cleanup personalizzato se necessario
    jest.clearAllTimers();
  });

  it('should maintain user email during profile update', async () => {
    const requestBody = ProfileTestDataFactory.createProfileUpdateRequest({
      name: 'Updated Name'
    });

    const expectedUser = { ...testUser, name: 'Updated Name' };
    ProfileTestHelpers.setupSuccessfulPrismaUpdate(expectedUser);

    const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(requestBody);

    ProfileTestHelpers.expectSuccessfulUpdate(response, data, expectedUser);
    expect(data.user?.email).toBe(testUser.email); // Email non dovrebbe cambiare
  });
});
```

## Best Practices Riassunte

1. **Usa sempre la factory** per creare oggetti di test consistenti
2. **Sfrutta gli helper** per operazioni comuni e ripetitive
3. **Implementa test parametrizzati** per scenari simili
4. **Utilizza il builder pattern** per test complessi
5. **Mantieni i test focalizzati** su un singolo aspetto
6. **Documenta scenari complessi** con nomi descrittivi
7. **Separa setup, esecuzione e verifica** chiaramente
8. **Riutilizza pattern** per altri endpoint API

Questi pattern rendono i test più manutenibili, leggibili e facili da estendere per nuove funzionalità.