import { readJsonFileStore } from "@solib/cli-base";
import { writeFile } from "fs/promises";
import { join } from "path";
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
  KeywordNjpParameter,
  NjpParameter
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
  const nextConfigJsContent = `/* eslint-disable */

module.exports = {
  images: {
    domains: [${config.imageDomains.map(d => `"${d}"`).join(", ")}]
  },
  publicRuntimeConfig: ${JSON.stringify(config.publicRuntimeConfig)},
  serverRuntimeConfig: ${JSON.stringify(config.serverRuntimeConfig)}
};
`;

  await writeFile(join(dir, file_nextConfigJs), nextConfigJsContent);
};

export const generateNextConfig = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  const config = await generateCombinedConfig(dir, moduleIndicators);

  const njpParameterPaths = getKeywordPaths(config, [KeywordNjpParameter])[
    KeywordNjpParameter
  ];

  const parameterValues = await readJsonFileStore(
    join(dir, file_parametersJson)
  );

  njpParameterPaths.forEach(njpParameterPath => {
    const parameterName = (
      getKeyword(config, njpParameterPath) as NjpParameter
    )[KeywordNjpParameter];
    replaceKeyword(config, njpParameterPath, parameterValues[parameterName]);
  });

  await generateDotEnvFile(dir, config);
  await generateNextConfigJs(dir, config);
};
