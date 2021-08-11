/* eslint-disable */

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/**.test.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/tasks/codeSanity/**",
    "!src/tasks/build/compileTypeScript.ts"
  ],
  coverageReporters: ["text", "lcov"],
  resolver: "<rootDir>/moduleResolver.js", // resolve packages havving only "module" key instead of "main" key
  transformIgnorePatterns: ["node_modules/(?!@sodaru)"], // include @sodaru-cli/base for transformation (esm to commonjs)
  transform: {
    "^.+\\.tsx?$": "ts-jest", // for ts files
    "^.+\\.jsx?$": "babel-jest" // for js files
  }
};
