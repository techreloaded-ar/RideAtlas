/**
 * Advanced integration tests using builder pattern and parameterized tests
 * Demonstrates the improved testing patterns
 */

import { PUT } from '@/app/api/profile/update/route';
import { prisma } from '@/lib/core/prisma';
import { auth } from '@/auth';
import { 
  ProfileTestHelpers, 
  ProfileUpdateTestBuilder, 
  TEST_CONSTANTS,
  TestScenario 
} from './index';

// Mock the auth function
jest.mock('@/auth');
const mockAuth = auth as jest.MockedFunction<typeof auth>;

// Mock Prisma
jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}));

describe('/api/profile/update - Advanced Tests', () => {
  beforeEach(() => {
    ProfileTestHelpers.clearAllMocks();
  });

  describe('Builder Pattern Examples', () => {
    it('should handle complex scenario with builder', async () => {
      const scenario = new ProfileUpdateTestBuilder()
        .withName('complex user profile update')
        .withValidSocialLinks()
        .withUserData({
          name: 'Advanced Test User',
          bio: 'This is a comprehensive test scenario'
        })
        .build();

      if (scenario.mockResponse) {
        ProfileTestHelpers.setupSuccessfulPrismaUpdate(scenario.mockResponse);
      }

      const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(
        scenario.requestBody
      );

      if (scenario.shouldSucceed && scenario.mockResponse) {
        ProfileTestHelpers.expectSuccessfulUpdate(response, data, scenario.mockResponse);
      }
    });
  });

  describe('Parameterized Authentication Tests', () => {
    const authScenarios = ProfileUpdateTestBuilder.createAuthenticationScenarios();

    test.each(authScenarios)(
      'should handle $name correctly',
      async (scenario: TestScenario) => {
        if (scenario.mockResponse) {
          ProfileTestHelpers.setupSuccessfulPrismaUpdate(scenario.mockResponse);
        }

        const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(
          scenario.requestBody,
          { authenticated: scenario.shouldSucceed }
        );

        expect(response.status).toBe(scenario.expectedStatus);

        if (scenario.shouldSucceed && scenario.mockResponse) {
          ProfileTestHelpers.expectSuccessfulUpdate(response, data, scenario.mockResponse);
        } else if (scenario.expectedStatus === TEST_CONSTANTS.HTTP_STATUS.UNAUTHORIZED) {
          ProfileTestHelpers.expectUnauthorizedError(response, data);
        }
      }
    );
  });

  describe('Parameterized Validation Tests', () => {
    const validationScenarios = ProfileUpdateTestBuilder.createValidationScenarios();

    test.each(validationScenarios)(
      'should handle $name correctly',
      async (scenario: TestScenario) => {
        const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(
          scenario.requestBody
        );

        expect(response.status).toBe(scenario.expectedStatus);
        ProfileTestHelpers.expectValidationError(response, data);
        ProfileTestHelpers.expectPrismaUpdateNotCalled();
      }
    );
  });

  describe('Edge Cases with Builder', () => {
    it('should handle user with only website social link', async () => {
      const scenario = new ProfileUpdateTestBuilder()
        .withRequestBody({
          name: 'Website Only User',
          socialLinks: { website: 'https://mywebsite.com' }
        })
        .withUserData({
          name: 'Website Only User',
          socialLinks: { website: 'https://mywebsite.com' }
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

    it('should handle database error gracefully', async () => {
      const scenario = new ProfileUpdateTestBuilder()
        .withDatabaseError()
        .build();

      ProfileTestHelpers.setupFailedPrismaUpdate(new Error('Connection timeout'));

      const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(
        scenario.requestBody
      );

      ProfileTestHelpers.expectServerError(response, data);
    });
  });

  describe('Performance and Load Testing Scenarios', () => {
    it('should handle multiple rapid requests', async () => {
      const scenarios = Array.from({ length: 5 }, (_, i) =>
        new ProfileUpdateTestBuilder()
          .withUserData({
            name: `User ${i}`,
            bio: `Bio for user ${i}`
          })
          .build()
      );

      const promises = scenarios.map(async (scenario, index) => {
        if (scenario.mockResponse) {
          ProfileTestHelpers.setupSuccessfulPrismaUpdate(scenario.mockResponse);
        }

        return ProfileTestHelpers.makeProfileUpdateRequest(
          scenario.requestBody,
          { userId: `user-${index}` }
        );
      });

      const results = await Promise.all(promises);

      results.forEach(({ response }) => {
        expect(response.status).toBe(TEST_CONSTANTS.HTTP_STATUS.OK);
      });
    });
  });
});