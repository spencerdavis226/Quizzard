/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/backend/src/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
};
