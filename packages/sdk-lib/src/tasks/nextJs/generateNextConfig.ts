import { readJsonFileStore, unixStylePath } from "@solib/cli-base";
import { writeFile } from "fs/promises";
import { join, relative } from "path";
import {
  file_dotenv,
  file_nextConfigJs,
  file_parametersJson
} from "../../utils/constants";
import {
  getKeyword,
  getKeywordPaths,
  replaceKeyword
} from "../../utils/keywords";
import {
  Config,
  generateCombinedConfig,
  KeywordSomodParameter,
  SomodParameter
} from "../../utils/nextJs/config";

const generateDotEnvFile = async (
  dir: string,
  config: Config
): Promise<void> => {
  const envLines: string[] = [];
  Object.keys(config.env || {}).forEach(envName => {
    envLines.push(`${envName}=${JSON.stringify(config.env[envName])}`);
  });
  await writeFile(join(dir, file_dotenv), envLines.join("\n"));
};

const generateNextConfigJs = async (
  dir: string,
  config: Config
): Promise<void> => {
  /**
   * NOTE: This code will be part of somod cli (dist/index.js)
   * Assumed structure of somod
   * ```
   *    bin
   *      - somod.js
   *    dist
   *      - index.js
   *    scripts
   *      - withBaseConfig.js
   * ```
   *
   * So the withBaseConfigPath is calculated in relative to dist/index.js
   */
  const withBaseConfigPath = join(__dirname, "../scripts/withBaseConfig.js");

  const relativePath = unixStylePath(relative(dir, withBaseConfigPath));

  const withBaseConfigRelativePath =
    relativePath.startsWith("../") || // already relative path
    relativePath.startsWith("/") || // absolute path in UNIX or IOS
    /^[A-Z]:\//.test(relativePath) // absolute path in Win
      ? relativePath
      : "./" + relativePath;

  const nextConfigJsContent = `/* eslint-disable */

const config = {
  images: {
    domains: [${config.imageDomains.map(d => `"${d}"`).join(", ")}]
  },
  publicRuntimeConfig: ${JSON.stringify(config.publicRuntimeConfig)},
  serverRuntimeConfig: ${JSON.stringify(config.serverRuntimeConfig)}
};

const withBaseConfig = require("${withBaseConfigRelativePath}");

module.exports = withBaseConfig(__dirname, config);
`;

  await writeFile(join(dir, file_nextConfigJs), nextConfigJsContent);
};

export const generateNextConfig = async (dir: string): Promise<void> => {
  const config = await generateCombinedConfig(dir);

  const somodParameterPaths = getKeywordPaths(config, [KeywordSomodParameter])[
    KeywordSomodParameter
  ];

  const parameterValues = await readJsonFileStore(
    join(dir, file_parametersJson)
  );

  somodParameterPaths.forEach(somodParameterPath => {
    const parameterName = (
      getKeyword(config, somodParameterPath) as SomodParameter
    )[KeywordSomodParameter];
    replaceKeyword(config, somodParameterPath, parameterValues[parameterName]);
  });

  await generateDotEnvFile(dir, config);
  await generateNextConfigJs(dir, config);
};
