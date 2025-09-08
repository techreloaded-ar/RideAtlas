/**
 * Builder pattern for creating complex test scenarios
 */

import { TestScenario, ProfileUpdateRequest, MockUser, SocialLinks } from './types';
import { ProfileTestDataFactory } from './factory';
import { TEST_CONSTANTS } from './constants';

export class ProfileUpdateTestBuilder {
  private scenario: TestScenario;

  constructor() {
    this.scenario = {
      name: 'default test scenario',
      requestBody: ProfileTestDataFactory.createProfileUpdateRequest(),
      expectedStatus: TEST_CONSTANTS.HTTP_STATUS.OK,
      shouldSucceed: true,
      mockResponse: ProfileTestDataFactory.createMockUser()
    };
  }

  /**
   * Sets the test scenario name
   */
  withName(name: string): this {
    this.scenario.name = name;
    return this;
  }

  /**
   * Adds valid social links to the request
   */
  withValidSocialLinks(): this {
    const validSocialLinks = ProfileTestDataFactory.createValidSocialLinks();
    this.scenario.requestBody.socialLinks = validSocialLinks;
    this.scenario.mockResponse!.socialLinks = validSocialLinks;
    return this;
  }

  /**
   * Adds invalid social links to the request
   */
  withInvalidSocialLinks(socialLinks?: SocialLinks): this {
    const invalidLinks = socialLinks || {
      instagram: 'invalid-url',
      youtube: 'https://notyoutube.com/user'
    };
    
    this.scenario.requestBody.socialLinks = invalidLinks;
    this.scenario.expectedStatus = TEST_CONSTANTS.HTTP_STATUS.BAD_REQUEST;
    this.scenario.shouldSucceed = false;
    this.scenario.mockResponse = undefined;
    return this;
  }

  /**
   * Adds empty social links to the request
   */
  withEmptySocialLinks(): this {
    const emptySocialLinks = ProfileTestDataFactory.createEmptySocialLinks();
    this.scenario.requestBody.socialLinks = emptySocialLinks;
    this.scenario.mockResponse!.socialLinks = null;
    return this;
  }

  /**
   * Sets the request to be unauthenticated
   */
  withoutAuthentication(): this {
    this.scenario.expectedStatus = TEST_CONSTANTS.HTTP_STATUS.UNAUTHORIZED;
    this.scenario.shouldSucceed = false;
    this.scenario.mockResponse = undefined;
    return this;
  }

  /**
   * Sets invalid request data (missing name)
   */
  withInvalidRequestData(): this {
    this.scenario.requestBody = { bio: 'Test bio' } as any; // Missing name
    this.scenario.expectedStatus = TEST_CONSTANTS.HTTP_STATUS.BAD_REQUEST;
    this.scenario.shouldSucceed = false;
    this.scenario.mockResponse = undefined;
    return this;
  }

  /**
   * Sets empty name field
   */
  withEmptyName(): this {
    this.scenario.requestBody.name = '';
    this.scenario.expectedStatus = TEST_CONSTANTS.HTTP_STATUS.BAD_REQUEST;
    this.scenario.shouldSucceed = false;
    this.scenario.mockResponse = undefined;
    return this;
  }

  /**
   * Sets a bio that is too long
   */
  withTooLongBio(): this {
    const longBio = ProfileTestDataFactory.createTooLongBio();
    this.scenario.requestBody.bio = longBio;
    this.scenario.expectedStatus = TEST_CONSTANTS.HTTP_STATUS.BAD_REQUEST;
    this.scenario.shouldSucceed = false;
    this.scenario.mockResponse = undefined;
    return this;
  }

  /**
   * Sets up a database error scenario
   */
  withDatabaseError(): this {
    this.scenario.expectedStatus = TEST_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR;
    this.scenario.shouldSucceed = false;
    this.scenario.mockResponse = undefined;
    return this;
  }

  /**
   * Sets custom user data
   */
  withUserData(userData: Partial<MockUser>): this {
    this.scenario.requestBody = {
      ...this.scenario.requestBody,
      name: userData.name || this.scenario.requestBody.name,
      bio: userData.bio !== undefined ? (userData.bio ?? undefined) : this.scenario.requestBody.bio
    };
    
    if (this.scenario.mockResponse) {
      this.scenario.mockResponse = {
        ...this.scenario.mockResponse,
        ...userData
      };
    }
    return this;
  }

  /**
   * Sets custom request body
   */
  withRequestBody(requestBody: Partial<ProfileUpdateRequest>): this {
    this.scenario.requestBody = {
      ...this.scenario.requestBody,
      ...requestBody
    };
    return this;
  }

  /**
   * Builds and returns the test scenario
   */
  build(): TestScenario {
    return { ...this.scenario };
  }

  /**
   * Creates multiple scenarios for parameterized tests
   */
  static createInvalidSocialLinksScenarios(): TestScenario[] {
    return TEST_CONSTANTS.INVALID_SOCIAL_LINKS_SCENARIOS.map(({ name, socialLinks }) =>
      new ProfileUpdateTestBuilder()
        .withName(`invalid social links: ${name}`)
        .withInvalidSocialLinks(socialLinks)
        .build()
    );
  }

  /**
   * Creates scenarios for different authentication states
   */
  static createAuthenticationScenarios(): TestScenario[] {
    return [
      new ProfileUpdateTestBuilder()
        .withName('unauthenticated user')
        .withoutAuthentication()
        .build(),
      
      new ProfileUpdateTestBuilder()
        .withName('user with valid session')
        .withValidSocialLinks()
        .build()
    ];
  }

  /**
   * Creates scenarios for input validation
   */
  static createValidationScenarios(): TestScenario[] {
    return [
      new ProfileUpdateTestBuilder()
        .withName('missing required name field')
        .withInvalidRequestData()
        .build(),
      
      new ProfileUpdateTestBuilder()
        .withName('bio too long')
        .withTooLongBio()
        .build(),
      
      new ProfileUpdateTestBuilder()
        .withName('empty name field')
        .withEmptyName()
        .build()
    ];
  }
}