import { ErrorSet, readJsonFileStore } from "@solib/cli-base";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { isString, sortBy, uniqBy } from "lodash";
import { dirname, join } from "path";
import {
  file_configJson,
  file_configYaml,
  namespace_env_config,
  namespace_public_runtime_config,
  namespace_server_runtime_config,
  path_build,
  path_ui
} from "../constants";
import { freeze } from "../freeze";
import {
  JSONType,
  KeywordProcessor,
  KeywordValidator,
  parseJson,
  processKeywords,
  validateKeywords
} from "../jsonTemplate";
import { keywordAjvCompile } from "../keywords/ajv-compile";
import { keywordAnd } from "../keywords/and";
import { keywordEquals } from "../keywords/equals";
import { keywordIf } from "../keywords/if";
import { keywordJsonParse } from "../keywords/json-parse";
import { keywordJsonStringify } from "../keywords/json-stringify";
import { keywordKey } from "../keywords/key";
import { keywordOr } from "../keywords/or";
import { keywordParameter } from "../keywords/parameter";
import {
  KeywordDefinition,
  ModuleContent,
  ModuleContentMap
} from "../keywords/types";
import { Module, ModuleHandler, NamespaceLoader } from "../moduleHandler";
import { readYamlFileStore } from "../yamlFileStore";

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
  return {
    [namespace_env_config]: Object.keys(config?.env || {}),
    [namespace_public_runtime_config]: Object.keys(
      config?.publicRuntimeConfig || {}
    ),
    [namespace_server_runtime_config]: Object.keys(
      config?.serverRuntimeConfig || {}
    )
  };
};

export const getModuleContentMap = async (
  modules: Module[]
): Promise<ModuleContentMap<Config>> => {
  const moduleContentMap: Record<string, ModuleContent<Config>> = {};

  await Promise.all(
    modules.map(async module => {
      const config = await loadConfig(module);
      moduleContentMap[module.name] = {
        moduleName: module.name,
        location: module.packageLocation,
        path: module.root
          ? `${path_ui}/${file_configYaml}`
          : `${path_build}/${path_ui}/${file_configJson}`,
        json: config
      };
    })
  );

  return freeze(moduleContentMap);
};

export const validate = async (
  dir: string,
  pluginKeywords: KeywordDefinition[] = []
) => {
  const moduleHandler = ModuleHandler.getModuleHandler();

  const moduleNodes = await moduleHandler.listModules();
  const moduleContentMap = await getModuleContentMap(
    moduleNodes.map(m => m.module)
  );
  const rootModuleName = (await moduleHandler.getRoodModuleNode()).module.name;

  const keywords = [...getBaseKeywords(), ...pluginKeywords];

  const keywordValidators: Record<string, KeywordValidator> = {};

  await Promise.all(
    keywords.map(async keyword => {
      const validator = await keyword.getValidator(
        dir,
        rootModuleName,
        moduleContentMap
      );

      keywordValidators[keyword.keyword] = validator;
    })
  );

  const errors = validateKeywords(
    parseJson(moduleContentMap[rootModuleName].json),
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
  dir: string,
  pluginKeywords: KeywordDefinition[] = []
): Promise<Config> => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  const allModules = await moduleHandler.listModules();

  const moduleContentMap = await getModuleContentMap(
    allModules.map(m => m.module)
  );
  const rootModuleName = (await moduleHandler.getRoodModuleNode()).module.name;

  const keywords = [...getBaseKeywords(), ...pluginKeywords];

  const keywordProcessors: Record<string, KeywordProcessor> = {};

  await Promise.all(
    keywords.map(async keyword => {
      const processor = await keyword.getProcessor(
        dir,
        rootModuleName,
        moduleContentMap
      );

      keywordProcessors[keyword.keyword] = processor;
    })
  );

  const processsedMap: Record<string, Config> = {};

  allModules.reverse();
  allModules.forEach(moduleNode => {
    const moduleName = moduleNode.module.name;
    processsedMap[moduleName] = processKeywords(
      parseJson(moduleContentMap[moduleName].json),
      keywordProcessors
    ) as Config;
  });

  const namespaces = await moduleHandler.getNamespaces();

  const combinedImageDomains: Config["imageDomains"] = [];
  Object.values(processsedMap).forEach(config => {
    combinedImageDomains.push(...config.imageDomains);
  });

  const combinedEnv: Config["env"] = {};
  Object.keys(namespaces[namespace_env_config]).forEach(envName => {
    const moduleName = namespaces[namespace_env_config][envName];
    combinedEnv[envName] = processsedMap[moduleName].env[envName];
  });

  const combinedPublicRuntimeConfig: Config["publicRuntimeConfig"] = {};
  Object.keys(namespaces[namespace_public_runtime_config]).forEach(
    configName => {
      const moduleName =
        namespaces[namespace_public_runtime_config][configName];
      combinedPublicRuntimeConfig[configName] =
        processsedMap[moduleName].publicRuntimeConfig[configName];
    }
  );

  const combinedServerRuntimeConfig: Config["serverRuntimeConfig"] = {};
  Object.keys(namespaces[namespace_server_runtime_config]).forEach(
    configName => {
      const moduleName =
        namespaces[namespace_server_runtime_config][configName];
      combinedServerRuntimeConfig[configName] =
        processsedMap[moduleName].serverRuntimeConfig[configName];
    }
  );

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
