/**
 * Helper functions for profile update integration tests
 */

import { NextRequest } from 'next/server';
import { PUT } from '@/app/api/profile/update/route';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';
import { ApiResponse, MockUser, ProfileUpdateRequest } from './types';
import { TEST_CONSTANTS } from './constants';
import { ProfileTestDataFactory } from './factory';

export class ProfileTestHelpers {
  /**
   * Makes a profile update request with optional authentication
   */
  static async makeProfileUpdateRequest(
    body: ProfileUpdateRequest | string,
    options: { 
      authenticated?: boolean;
      userId?: string;
    } = {}
  ): Promise<{ response: Response; data: ApiResponse }> {
    
    const { authenticated = true, userId = TEST_CONSTANTS.MOCK_USER_ID } = options;

    // Get mock functions
    const mockAuth = auth as jest.MockedFunction<typeof auth>;

    // Setup authentication mock
    if (authenticated) {
      const mockSession = ProfileTestDataFactory.createMockSession(userId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockAuth as any).mockResolvedValue(mockSession);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockAuth as any).mockResolvedValue(null);
    }

    // Create request
    const requestBody = typeof body === 'string' ? body : JSON.stringify(body);
    const request = new NextRequest(TEST_CONSTANTS.API_ENDPOINT, {
      method: 'PUT',
      body: requestBody,
      headers: { 'Content-Type': 'application/json' }
    });

    // Execute request
    const response = await PUT(request);
    const data = await response.json();
    
    return { response, data };
  }

  /**
   * Sets up Prisma mock to return successful update
   */
  static setupSuccessfulPrismaUpdate(mockUser: MockUser): void {
    const mockPrismaUpdate = prisma.user.update as jest.MockedFunction<typeof prisma.user.update>;
    mockPrismaUpdate.mockResolvedValue(mockUser as any);
  }

  /**
   * Sets up Prisma mock to throw an error
   */
  static setupFailedPrismaUpdate(error: Error = new Error('Database error')): void {
    const mockPrismaUpdate = prisma.user.update as jest.MockedFunction<typeof prisma.user.update>;
    mockPrismaUpdate.mockRejectedValue(error);
  }

  /**
   * Expects a successful profile update response
   */
  static expectSuccessfulUpdate(
    response: Response, 
    data: ApiResponse, 
    expectedUser: MockUser
  ): void {
    expect(response.status).toBe(TEST_CONSTANTS.HTTP_STATUS.OK);
    expect(data.success).toBe(true);
    expect(data.user).toEqual(expectedUser);
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
   * Expects a social links validation error response
   */
  static expectSocialLinksValidationError(response: Response, data: ApiResponse): void {
    expect(response.status).toBe(TEST_CONSTANTS.HTTP_STATUS.BAD_REQUEST);
    expect(data.error).toBe(TEST_CONSTANTS.ERROR_MESSAGES.INVALID_SOCIAL_LINKS);
    expect(data.details).toBeInstanceOf(Array);
    expect(data.details!.length).toBeGreaterThan(0);
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
   * Expects Prisma update to have been called with specific data
   */
  static expectPrismaUpdateCalledWith(
    userId: string,
    updateData: Partial<ProfileUpdateRequest>
  ): void {
    const mockPrismaUpdate = prisma.user.update as jest.MockedFunction<typeof prisma.user.update>;
    expect(mockPrismaUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        bio: true,
        bikeDescription: true,
        email: true,
        socialLinks: true
      }
    });
  }

  /**
   * Expects Prisma update to not have been called
   */
  static expectPrismaUpdateNotCalled(): void {
    const mockPrismaUpdate = prisma.user.update as jest.MockedFunction<typeof prisma.user.update>;
    expect(mockPrismaUpdate).not.toHaveBeenCalled();
  }

  /**
   * Clears all mocks - should be called in beforeEach
   */
  static clearAllMocks(): void {
    jest.clearAllMocks();
  }
}