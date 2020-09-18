module.exports = {
  testEnvironment: 'jsdom',
  coveragePathIgnorePatterns: [
    '/node_modules/',
  ],
  testMatch: [
    '<rootDir>/test/**/*.@(spec|test).[jt]s',
  ],
};
