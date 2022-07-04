/* eslint-disable */

const commonConfig = require("@sodev/jest-config");

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  ...commonConfig,
  transformIgnorePatterns: ["node_modules/(?!@so|js-yaml)"]
};
