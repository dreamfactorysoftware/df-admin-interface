module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  // Playwright specs live under e2e/ and must never be picked up by Jest.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
  transformIgnorePatterns: [
    'node_modules/(?!@angular|swagger-ui|react-syntax-highlighter|swagger-client|@ngneat|@fortawesome)',
  ],
  coverageReporters: ['html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/**/*.d.ts',
    '!src/app/shared/types/*',
    '!src/app/shared/constants/*',
    '!src/**/*.mock.ts',
  ],
};
