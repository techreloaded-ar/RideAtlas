const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Fornisce il percorso a next.config.js e .env files nel tuo ambiente di test
  dir: './',
});

// Configurazione Jest personalizzata
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '<rootDir>/src/tests/**/*.test.{ts,tsx}',
    '<rootDir>/src/tests/**/*.spec.{ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**/*',
    '!src/app/layout.tsx',
    '!src/app/globals.css',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/auth$': '<rootDir>/src/tests/unit/mocks/auth.ts',
    '^@/app/api/admin/users/route$': '<rootDir>/src/tests/unit/mocks/api/admin/users/route.ts',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth|@next|@next-auth|@panva|jose|preact|oauth4webapi|uuid|@testing-library)/)',
  ],
  testTimeout: 10000,
};

// createJestConfig è esportato in questo modo per garantire che next/jest possa caricare la configurazione Next.js
module.exports = createJestConfig(customJestConfig);