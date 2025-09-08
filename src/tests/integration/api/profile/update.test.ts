/**
 * Integration tests for the profile update API endpoint
 * Tests social links validation, sanitization, and error handling
 */

import { NextRequest } from 'next/server';
import { PUT } from '@/app/api/profile/update/route';
import { prisma } from '@/lib/core/prisma';
import { auth } from '@/auth';
import { ProfileTestHelpers } from './helpers';
import { ProfileTestDataFactory } from './factory';
import { TEST_CONSTANTS } from './constants';

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

const mockPrismaUpdate = prisma.user.update as jest.MockedFunction<typeof prisma.user.update>;

describe('/api/profile/update', () => {
  beforeEach(() => {
    ProfileTestHelpers.clearAllMocks();
  });

  describe('Social Links Validation', () => {
    it('should successfully update profile with valid social links', async () => {
      const validSocialLinks = ProfileTestDataFactory.createValidSocialLinks();
      const requestBody = ProfileTestDataFactory.createProfileUpdateRequest({
        bio: 'Test bio',
        socialLinks: validSocialLinks
      });

      const mockUpdatedUser = ProfileTestDataFactory.createMockUser({
        name: 'Test User',
        bio: 'Test bio',
        socialLinks: validSocialLinks
      });

      ProfileTestHelpers.setupSuccessfulPrismaUpdate(mockUpdatedUser);

      const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(requestBody);

      ProfileTestHelpers.expectSuccessfulUpdate(response, data, mockUpdatedUser);
      ProfileTestHelpers.expectPrismaUpdateCalledWith(TEST_CONSTANTS.MOCK_USER_ID, {
        name: 'Test User',
        bio: 'Test bio',
        socialLinks: validSocialLinks
      });
    });

    it('should handle empty social links', async () => {
      const emptySocialLinks = ProfileTestDataFactory.createEmptySocialLinks();
      const requestBody = ProfileTestDataFactory.createProfileUpdateRequest({
        socialLinks: emptySocialLinks
      });

      const mockUpdatedUser = ProfileTestDataFactory.createMockUser({
        name: 'Test User',
        socialLinks: null
      });

      ProfileTestHelpers.setupSuccessfulPrismaUpdate(mockUpdatedUser);

      const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(requestBody);

      ProfileTestHelpers.expectSuccessfulUpdate(response, data, mockUpdatedUser);
      ProfileTestHelpers.expectPrismaUpdateCalledWith(TEST_CONSTANTS.MOCK_USER_ID, {
        name: 'Test User',
        bio: null,
        socialLinks: undefined
      });
    });

    it('should sanitize URLs by adding https protocol', async () => {
      const unsanitizedLinks = ProfileTestDataFactory.createUnsanitizedSocialLinks();
      const requestBody = ProfileTestDataFactory.createProfileUpdateRequest({
        socialLinks: unsanitizedLinks
      });

      const expectedSanitizedLinks = ProfileTestDataFactory.createSanitizedSocialLinks();
      const mockUpdatedUser = ProfileTestDataFactory.createMockUser({
        name: 'Test User',
        socialLinks: expectedSanitizedLinks
      });

      ProfileTestHelpers.setupSuccessfulPrismaUpdate(mockUpdatedUser);

      const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(requestBody);

      ProfileTestHelpers.expectSuccessfulUpdate(response, data, mockUpdatedUser);
      ProfileTestHelpers.expectPrismaUpdateCalledWith(TEST_CONSTANTS.MOCK_USER_ID, {
        name: 'Test User',
        bio: null,
        socialLinks: expectedSanitizedLinks
      });
    });

    it('should handle partial social links updates', async () => {
      const partialSocialLinks = ProfileTestDataFactory.createPartialSocialLinks();
      const requestBody = ProfileTestDataFactory.createProfileUpdateRequest({
        socialLinks: partialSocialLinks
      });

      const expectedPartialLinks = ProfileTestDataFactory.createExpectedPartialSocialLinks();
      const mockUpdatedUser = ProfileTestDataFactory.createMockUser({
        name: 'Test User',
        socialLinks: expectedPartialLinks
      });

      ProfileTestHelpers.setupSuccessfulPrismaUpdate(mockUpdatedUser);

      const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(requestBody);

      ProfileTestHelpers.expectSuccessfulUpdate(response, data, mockUpdatedUser);
      ProfileTestHelpers.expectPrismaUpdateCalledWith(TEST_CONSTANTS.MOCK_USER_ID, {
        name: 'Test User',
        bio: null,
        socialLinks: expectedPartialLinks
      });
    });

    // Parameterized tests for invalid social links
    describe('Invalid Social Links Scenarios', () => {
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
    });
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      const requestBody = ProfileTestDataFactory.createProfileUpdateRequest();

      const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(
        requestBody,
        { authenticated: false }
      );

      ProfileTestHelpers.expectUnauthorizedError(response, data);
      ProfileTestHelpers.expectPrismaUpdateNotCalled();
    });

    it('should return 401 when session has no user ID', async () => {
      // Mock auth to return session without user ID - this should be done before calling the helper
      mockAuth.mockResolvedValue({ user: {} } as any);

      const requestBody = ProfileTestDataFactory.createProfileUpdateRequest();

      // Create request manually to avoid helper overriding the mock
      const request = new NextRequest(TEST_CONSTANTS.API_ENDPOINT, {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request);
      const data = await response.json();

      ProfileTestHelpers.expectUnauthorizedError(response, data);
      ProfileTestHelpers.expectPrismaUpdateNotCalled();
    });
  });

  describe('Input Validation', () => {
    it('should return 400 for missing required name field', async () => {
      const requestBody = { bio: 'Test bio' }; // Missing name field

      const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(requestBody as any);

      ProfileTestHelpers.expectValidationError(response, data);
      ProfileTestHelpers.expectPrismaUpdateNotCalled();
    });

    it('should return 400 for empty name field', async () => {
      const requestBody = ProfileTestDataFactory.createProfileUpdateRequest({ name: '' });

      const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(requestBody);

      ProfileTestHelpers.expectValidationError(response, data);
      ProfileTestHelpers.expectPrismaUpdateNotCalled();
    });

    it('should return 400 for bio that is too long', async () => {
      const longBio = ProfileTestDataFactory.createTooLongBio();
      const requestBody = ProfileTestDataFactory.createProfileUpdateRequest({ bio: longBio });

      const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(requestBody);

      ProfileTestHelpers.expectValidationError(response, data);
      ProfileTestHelpers.expectPrismaUpdateNotCalled();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when database update fails', async () => {
      const requestBody = ProfileTestDataFactory.createProfileUpdateRequest();
      
      ProfileTestHelpers.setupFailedPrismaUpdate(new Error('Database error'));

      const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(requestBody);

      ProfileTestHelpers.expectServerError(response, data);
    });

    it('should handle malformed JSON', async () => {
      const malformedJson = ProfileTestDataFactory.createMalformedJson();

      const { response, data } = await ProfileTestHelpers.makeProfileUpdateRequest(malformedJson);

      ProfileTestHelpers.expectServerError(response, data);
      ProfileTestHelpers.expectPrismaUpdateNotCalled();
    });
  });
});