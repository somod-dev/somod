/* eslint-disable */

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/**.test.[jt]s"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/tasks/codeSanity/**",
    "!src/tasks/build/compileTypeScript.ts"
  ],
  coverageReporters: ["text", "lcov"]
};
