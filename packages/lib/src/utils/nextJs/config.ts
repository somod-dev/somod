import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { isString, sortBy, uniqBy } from "lodash";
import { readJsonFileStore, readYamlFileStore } from "nodejs-file-utils";
import { dirname, join } from "path";
import {
  IContext,
  JSONType,
  KeywordProcessor,
  KeywordValidator,
  Module,
  NamespaceLoader
} from "somod-types";
import {
  file_configJson,
  file_configYaml,
  namespace_env_config,
  namespace_public_runtime_config,
  namespace_server_runtime_config,
  path_build,
  path_ui
} from "../constants";
import ErrorSet from "../ErrorSet";
import { parseJson, processKeywords, validateKeywords } from "../jsonTemplate";
import { keywordAjvCompile } from "../keywords/ajv-compile";
import { keywordAnd } from "../keywords/and";
import { keywordEquals } from "../keywords/equals";
import { keywordIf } from "../keywords/if";
import { keywordJsonParse } from "../keywords/json-parse";
import { keywordJsonStringify } from "../keywords/json-stringify";
import { keywordKey } from "../keywords/key";
import { keywordOr } from "../keywords/or";
import { keywordParameter } from "../keywords/parameter";

const getBaseKeywords = () => [
  keywordAjvCompile,
  keywordAnd,
  keywordEquals,
  keywordIf,
  keywordJsonParse,
  keywordJsonStringify,
  keywordKey,
  keywordOr,
  keywordParameter
];

// this must match the @somod/ui-config-schema/schemas/index.json
export type Config = {
  env?: Record<string, JSONType>;
  imageDomains?: (string | JSONType)[];
  publicRuntimeConfig?: Record<string, JSONType>;
  serverRuntimeConfig?: Record<string, JSONType>;
};

export const loadConfig = async (module: Module): Promise<Config> => {
  const configPath = join(
    module.packageLocation,
    module.root ? "" : path_build,
    path_ui,
    module.root ? file_configYaml : file_configJson
  );
  if (existsSync(configPath)) {
    return module.root
      ? await readYamlFileStore(configPath)
      : await readJsonFileStore(configPath);
  } else {
    return {};
  }
};

export const loadConfigNamespaces: NamespaceLoader = async module => {
  const config = await loadConfig(module);
  return [
    { name: namespace_env_config, values: Object.keys(config?.env || {}) },
    {
      name: namespace_public_runtime_config,
      values: Object.keys(config?.publicRuntimeConfig || {})
    },
    {
      name: namespace_server_runtime_config,
      values: Object.keys(config?.serverRuntimeConfig || {})
    }
  ];
};

export const validate = async (context: IContext) => {
  const rootModule = context.moduleHandler.getModule(
    context.moduleHandler.rootModuleName
  ).module;

  const keywords = [...getBaseKeywords()];
  context.extensionHandler.uiConfigKeywords.forEach(uiConfigKeywords => {
    keywords.push(...uiConfigKeywords.value);
  });

  const keywordValidators: Record<string, KeywordValidator> = {};

  await Promise.all(
    keywords.map(async keyword => {
      keywordValidators[keyword.keyword] = await keyword.getValidator(
        rootModule.name,
        context
      );
    })
  );

  const errors = await validateKeywords(
    parseJson(await loadConfig(rootModule)),
    keywordValidators
  );

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};

export const build = async (dir: string): Promise<void> => {
  const configYamlPath = join(dir, path_ui, file_configYaml);
  const yamlContentAsJson = (await readYamlFileStore(configYamlPath)) || {};

  const configJsonPath = join(dir, path_build, path_ui, file_configJson);

  await mkdir(dirname(configJsonPath), { recursive: true });
  await writeFile(configJsonPath, JSON.stringify(yamlContentAsJson));
};

export const generateCombinedConfig = async (
  context: IContext
): Promise<Config> => {
  const rootModuleName = context.moduleHandler.rootModuleName;

  const keywords = [...getBaseKeywords()];
  context.extensionHandler.uiConfigKeywords.forEach(uiConfigKeywords => {
    keywords.push(...uiConfigKeywords.value);
  });

  const keywordProcessors: Record<string, KeywordProcessor> = {};

  await Promise.all(
    keywords.map(async keyword => {
      keywordProcessors[keyword.keyword] = await keyword.getProcessor(
        rootModuleName,
        context
      );
    })
  );

  const processsedMap: Record<string, Config> = {};

  const allModules = [...context.moduleHandler.list];

  allModules.reverse();
  await Promise.all(
    allModules.map(async moduleNode => {
      const moduleName = moduleNode.module.name;
      processsedMap[moduleName] = (await processKeywords(
        parseJson(await loadConfig(moduleNode.module)),
        keywordProcessors
      )) as Config;
    })
  );

  const combinedImageDomains: Config["imageDomains"] = [];
  Object.values(processsedMap).forEach(config => {
    combinedImageDomains.push(...config.imageDomains);
  });

  const combinedEnv: Config["env"] = {};
  const envConfigNamespaces =
    context.namespaceHandler.get(namespace_env_config);
  envConfigNamespaces.forEach(({ module, value: envName }) => {
    combinedEnv[envName] = processsedMap[module].env[envName];
  });

  const combinedPublicRuntimeConfig: Config["publicRuntimeConfig"] = {};
  const publicRuntimeConfigNamespaces = context.namespaceHandler.get(
    namespace_public_runtime_config
  );
  publicRuntimeConfigNamespaces.forEach(({ module, value: configName }) => {
    combinedPublicRuntimeConfig[configName] =
      processsedMap[module].publicRuntimeConfig[configName];
  });

  const combinedServerRuntimeConfig: Config["serverRuntimeConfig"] = {};
  const serverRuntimeConfigNamespaces = context.namespaceHandler.get(
    namespace_server_runtime_config
  );
  serverRuntimeConfigNamespaces.forEach(({ module, value: configName }) => {
    combinedServerRuntimeConfig[configName] =
      processsedMap[module].serverRuntimeConfig[configName];
  });

  return {
    imageDomains: sortBy(
      uniqBy(combinedImageDomains, imageDomain =>
        isString(imageDomain) ? imageDomain : JSON.stringify(imageDomain)
      ),
      imageDomain =>
        isString(imageDomain) ? imageDomain : JSON.stringify(imageDomain)
    ),
    env: combinedEnv,
    publicRuntimeConfig: combinedPublicRuntimeConfig,
    serverRuntimeConfig: combinedServerRuntimeConfig
  };
};
