const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Fornisce il percorso a next.config.js e .env files nel tuo ambiente di test
  dir: './',
});

// Configurazione Jest personalizzata
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
};

// createJestConfig è esportato in questo modo per garantire che next/jest possa caricare la configurazione Next.js
module.exports = createJestConfig(customJestConfig);