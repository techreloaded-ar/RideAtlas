/**
 * TypeScript type definitions for profile update integration tests
 */

export interface MockSession {
  user: {
    id: string;
  };
}

export interface MockUser {
  id: string;
  name: string;
  bio: string | null;
  email: string;
  socialLinks: SocialLinks | null;
}

export interface SocialLinks {
  instagram?: string;
  youtube?: string;
  facebook?: string;
  tiktok?: string;
  linkedin?: string;
  website?: string;
}

export interface ProfileUpdateRequest {
  name: string;
  bio?: string;
  socialLinks?: SocialLinks;
}

export interface ApiResponse {
  success?: boolean;
  error?: string;
  details?: string[];
  user?: MockUser;
}

export interface TestScenario {
  name: string;
  requestBody: ProfileUpdateRequest;
  expectedStatus: number;
  shouldSucceed: boolean;
  mockResponse?: MockUser;
}