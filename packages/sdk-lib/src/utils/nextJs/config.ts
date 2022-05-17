import { existsSync } from "fs";
import { JSONSchema7 } from "json-schema";
import { join } from "path";
import { file_configJson, path_build, path_ui } from "../constants";
import { readJsonFileStore } from "@solib/cli-base";
import { ModuleInfo } from "../moduleInfo";
import { uniq } from "lodash";

export type EnvConfig = {
  schema: JSONSchema7;
  label?: string;
  default?: string;
};

export type RuntimeConfig = {
  schema: JSONSchema7;
  label?: string;
  default?: unknown;
};

// this must match the @somod/njp-config-schema/schemas/index.json
export type Config = {
  env?: Record<string, EnvConfig>;
  imageDomains?: string[];
  runtimeConfig?: Record<string, RuntimeConfig>;
  serverRuntimeConfig?: Record<string, RuntimeConfig>;
};

export type EnvToModuleMap = Record<
  string,
  { moduleName: string; config: EnvConfig }[]
>;

export type RuntimeConfigToModuleMap = Record<
  string,
  { moduleName: string; config: RuntimeConfig }[]
>;

export type ServerRuntimeConfigToModuleMap = Record<
  string,
  { moduleName: string; config: RuntimeConfig }[]
>;

export const readConfigJson = async (
  packageLocation: string
): Promise<Config> => {
  const configPath = join(
    packageLocation,
    path_build,
    path_ui,
    file_configJson
  );
  if (existsSync(configPath)) {
    return await readJsonFileStore(configPath, true);
  } else {
    return {};
  }
};

export type ConfigToModuleMap = {
  env: EnvToModuleMap;
  imageDomains: string[];
  runtimeConfig: RuntimeConfigToModuleMap;
  serverRuntimeConfig: ServerRuntimeConfigToModuleMap;
};

export const getConfigToModulesMap = async (
  modules: ModuleInfo[]
): Promise<ConfigToModuleMap> => {
  const allConfig: { moduleName: string; config: Config }[] = await Promise.all(
    modules.map(async ({ name, packageLocation }) => {
      return {
        moduleName: name,
        config: await readConfigJson(packageLocation)
      };
    })
  );

  const configMap: ConfigToModuleMap = {
    env: {},
    runtimeConfig: {},
    serverRuntimeConfig: {},
    imageDomains: []
  };

  const configKeys: (keyof Config)[] = [
    "env",
    "runtimeConfig",
    "serverRuntimeConfig"
  ];

  allConfig.forEach(moduleConfig => {
    // env, runtimeConfig, serverOnlyRuntimeConfig
    configKeys.forEach(configKey => {
      Object.keys(moduleConfig.config[configKey] || {}).forEach(configName => {
        if (!configMap[configKey][configName]) {
          configMap[configKey][configName] = [];
        }
        configMap[configKey][configName].push({
          moduleName: moduleConfig.moduleName,
          config: moduleConfig.config[configKey][configName]
        });
      });
    });

    // image domains
    configMap.imageDomains.push(...(moduleConfig.config.imageDomains || []));
  });

  configMap.imageDomains = uniq(configMap.imageDomains);

  return configMap;
};
