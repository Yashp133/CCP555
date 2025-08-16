// backend/jest.config.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'env.jest') });

module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 5000,
  roots: ['<rootDir>/tests'],
  testMatch: ['**/tests/**/*.test.js'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],

  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',

  //  Only enforce an overall lines threshold (assignment asks >80% overall)
  coverageThreshold: {
    global: { lines: 80 },
  },
};
