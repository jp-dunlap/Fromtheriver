/**
 * @type {import('jest').Config}
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests/unit'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/index.{ts,tsx}'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.test.json',
    },
  },
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
    '\\.(yaml|yml)(\\?raw)?$': '<rootDir>/tests/__mocks__/villagesRaw.js',
  },
};
