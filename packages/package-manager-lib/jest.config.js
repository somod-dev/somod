/* eslint-disable */

const commonConfig = require("@sodaru/jest-config");

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  ...commonConfig,
  collectCoverageFrom: [
    ...commonConfig.collectCoverageFrom,
    "!src/tasks/codeSanity/**",
    "!src/tasks/build/compileTypeScript.ts",
    "!src/tasks/init/installAwsLambdaTypesAsDevDependency.ts",
    "!src/tasks/init/installAwsSdkAsDevDependency.ts",
    "!src/tasks/init/installAwsSdkAsPeerDependency.ts"
  ],
  transformIgnorePatterns: ["node_modules/(?!@sodaru|js-yaml)"]
};
