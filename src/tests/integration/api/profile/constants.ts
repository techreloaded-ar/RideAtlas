/**
 * Test constants for profile update integration tests
 */

export const TEST_CONSTANTS = {
  MOCK_USER_ID: 'test-user-id',
  MOCK_EMAIL: 'test@example.com',
  API_ENDPOINT: 'http://localhost:3000/api/profile/update',
  MAX_BIO_LENGTH: 1000,

  ERROR_MESSAGES: {
    UNAUTHORIZED: 'Non autorizzato',
    INVALID_DATA: 'Dati non validi',
    INVALID_SOCIAL_LINKS: 'Link social non validi',
    SERVER_ERROR: 'Errore interno del server',
  },

  HTTP_STATUS: {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    INTERNAL_SERVER_ERROR: 500,
  },

  VALID_SOCIAL_LINKS: {
    instagram: 'https://instagram.com/testuser',
    youtube: 'https://youtube.com/@testuser',
    facebook: 'https://facebook.com/testuser',
    tiktok: 'https://tiktok.com/@testuser',
    linkedin: 'https://linkedin.com/in/testuser',
    website: 'https://example.com/',
  } as const,

  INVALID_SOCIAL_LINKS_SCENARIOS: [
    {
      name: 'completely invalid URLs',
      socialLinks: {
        instagram: 'invalid-url',
        youtube: 'https://notyoutube.com/user',
        facebook: 'https://facebook.com/',
        tiktok: 'https://tiktok.com/invalid',
        linkedin: 'https://linkedin.com/',
        website: 'not-a-url',
      },
    },
    {
      name: 'empty domain URLs',
      socialLinks: {
        facebook: 'https://facebook.com/',
        linkedin: 'https://linkedin.com/in/user',
      },
    },
    {
      name: 'wrong platform URLs',
      socialLinks: {
        instagram: 'https://facebook.com/user',
        youtube: 'https://instagram.com/user',
      },
    },
  ],
} as const;
