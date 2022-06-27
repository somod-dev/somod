import { readJsonFileStore } from "@solib/cli-base";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { isString, uniqBy } from "lodash";
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
import { getKeyword, getKeywordPaths } from "../keywords";
import { Module, ModuleHandler } from "../moduleHandler";
import { listAllParameters } from "../parameters/namespace";
import { readYamlFileStore } from "../yamlFileStore";

export const KeywordNjpParameter = "NJP::Parameter";

export type NjpParameter = {
  [KeywordNjpParameter]: string;
};

// this must match the @somod/njp-config-schema/schemas/index.json
export type Config = {
  env?: Record<string, NjpParameter>;
  imageDomains?: (string | NjpParameter)[];
  publicRuntimeConfig?: Record<string, NjpParameter>;
  serverRuntimeConfig?: Record<string, NjpParameter>;
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

export const loadConfigNamespaces = async (module: Module) => {
  if (
    !module.namespaces[namespace_env_config] ||
    !module.namespaces[namespace_public_runtime_config] ||
    !module.namespaces[namespace_server_runtime_config]
  ) {
    const config = await loadConfig(module);

    module.namespaces[namespace_env_config] = Object.keys(config.env || {});
    module.namespaces[namespace_public_runtime_config] = Object.keys(
      config.publicRuntimeConfig || {}
    );
    module.namespaces[namespace_server_runtime_config] = Object.keys(
      config.serverRuntimeConfig || {}
    );
  }
};

const buildConfigYaml = async (dir: string): Promise<void> => {
  const configYamlPath = join(dir, path_ui, file_configYaml);
  const yamlContentAsJson = (await readYamlFileStore(configYamlPath)) || {};

  const configJsonPath = join(dir, path_build, path_ui, file_configJson);

  await mkdir(dirname(configJsonPath), { recursive: true });
  await writeFile(configJsonPath, JSON.stringify(yamlContentAsJson, null, 2));
};

const validate = async (dir: string, moduleIndicators: string[]) => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir, moduleIndicators);
  const rootModuleNode = await moduleHandler.getRoodModuleNode();

  const config = await loadConfig(rootModuleNode.module);

  const parameters = await listAllParameters(dir, moduleIndicators);

  const keywordPaths = getKeywordPaths(config, [KeywordNjpParameter]);

  const missingParameters: string[] = [];
  keywordPaths[KeywordNjpParameter].forEach(njpParameterPath => {
    const njpParameter = getKeyword(config, njpParameterPath) as NjpParameter;

    const parameter = njpParameter[KeywordNjpParameter];
    if (!parameters.includes(parameter)) {
      missingParameters.push(parameter);
    }
  });

  if (missingParameters.length > 0) {
    throw new Error(
      `Following parameters referenced from '${path_ui}/${file_configYaml}' are not found\n${missingParameters
        .map(p => " - " + p)
        .join("\n")}`
    );
  }
};

export const buildConfig = async (dir: string, moduleIndicators: string[]) => {
  await validate(dir, moduleIndicators);
  await buildConfigYaml(dir);
};

export const generateCombinedConfig = async (
  dir: string,
  moduleIndicators: string[]
): Promise<Config> => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir, moduleIndicators);
  const allModules = await moduleHandler.listModules();

  const moduleNameToConfigMap: Record<string, Config> = {};
  await Promise.all(
    allModules.map(async moduleNode => {
      moduleNameToConfigMap[moduleNode.module.name] = await loadConfig(
        moduleNode.module
      );
    })
  );

  const namespaces = await moduleHandler.getNamespaces(
    Object.fromEntries(moduleIndicators.map(mt => [mt, loadConfigNamespaces]))
  );

  const combinedImageDomains: Config["imageDomains"] = [];
  Object.values(moduleNameToConfigMap).forEach(config => {
    combinedImageDomains.push(...config.imageDomains);
  });

  const combinedEnv: Config["env"] = {};
  Object.keys(namespaces[namespace_env_config]).forEach(envName => {
    const moduleName = namespaces[namespace_env_config][envName];
    combinedEnv[envName] = moduleNameToConfigMap[moduleName].env[envName];
  });

  const combinedPublicRuntimeConfig: Config["publicRuntimeConfig"] = {};
  Object.keys(namespaces[namespace_public_runtime_config]).forEach(
    configName => {
      const moduleName =
        namespaces[namespace_public_runtime_config][configName];
      combinedPublicRuntimeConfig[configName] =
        moduleNameToConfigMap[moduleName].publicRuntimeConfig[configName];
    }
  );

  const combinedServerRuntimeConfig: Config["serverRuntimeConfig"] = {};
  Object.keys(namespaces[namespace_server_runtime_config]).forEach(
    configName => {
      const moduleName =
        namespaces[namespace_server_runtime_config][configName];
      combinedServerRuntimeConfig[configName] =
        moduleNameToConfigMap[moduleName].serverRuntimeConfig[configName];
    }
  );

  return {
    imageDomains: uniqBy(combinedImageDomains, imageDomain =>
      isString(imageDomain) ? imageDomain : JSON.stringify(imageDomain)
    ),
    env: combinedEnv,
    publicRuntimeConfig: combinedPublicRuntimeConfig,
    serverRuntimeConfig: combinedServerRuntimeConfig
  };
};
