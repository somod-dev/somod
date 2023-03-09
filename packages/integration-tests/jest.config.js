/* eslint-disable */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/**.test.ts"],
  collectCoverageFrom: ["src/**/*.ts"],
  coverageReporters: ["text", "lcov"],
  testTimeout: 10000,
  transform: {
    "^.+\\.tsx?$": "ts-jest" // for ts & tsx files
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"]
};
