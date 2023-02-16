/* eslint-disable */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/**.test.ts"],
  collectCoverageFrom: ["src/**/*.ts"],
  coverageReporters: ["text", "lcov"],
  transformIgnorePatterns: ["node_modules/(?!@somod)"],
  transform: {
    "^.+\\.tsx?$": "ts-jest", // for ts & tsx files
    "^.+\\.jsx?$": [
      "babel-jest",
      { plugins: ["@babel/plugin-transform-modules-commonjs"] }
    ] // for js & jsx files
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  moduleNameMapper: {
    "somod-lib": "<rootDir>/node_modules/somod-lib/dist/index.js"
  }
};
