module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    // flat ships as ESM-only with an `exports` map that jest-preset-angular's
    // resolver doesn't follow. Resolve it explicitly so specs that load
    // transloco transitively can run under Jest.
    '^flat$': '<rootDir>/node_modules/flat/index.js',
  },
  // Playwright specs live under e2e/ and must never be picked up by Jest.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
  transformIgnorePatterns: [
    'node_modules/(?!@angular|swagger-ui|react-syntax-highlighter|swagger-client|@ngneat|@fortawesome|flat)',
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
