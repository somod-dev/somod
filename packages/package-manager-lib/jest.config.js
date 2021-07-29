/* eslint-disable */

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/**.test.[jt]s"],
  collectCoverageFrom: ["src/**/*.ts"],
  coverageReporters: ["text", "lcov"]
};
