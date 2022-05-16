import { resolve } from "../../utils/module";
import { getModuleInfo } from "../../utils/moduleInfo";
import {
  Config,
  ConfigToModuleMap,
  getConfigToModulesMap
} from "../../utils/nextJs/config";
import { ErrorSet } from "@solib/cli-base";
import { writeFile } from "fs/promises";
import { join } from "path";
import { file_dotenv, file_njpConfigJson } from "../../utils/constants";

const generateDotEnvFile = async (
  dir: string,
  config: Config
): Promise<void> => {
  const envLines: string[] = [];
  Object.keys(config.env || {}).forEach(envName => {
    envLines.push(`${envName}=${config.env[envName].default || ""}`);
  });
  await writeFile(join(dir, file_dotenv), envLines.join("\n"));
};

const generateNjpConfigFile = async (
  dir: string,
  config: Config
): Promise<void> => {
  // allowed subset of config from NextConfig
  const njpConfig: {
    images?: { domains?: string[] };
    publicRuntimeConfig?: Record<string, unknown>;
    serverRuntimeConfig?: Record<string, unknown>;
  } = {};

  if (config.imageDomains) {
    njpConfig.images = { domains: config.imageDomains };
  }
  if (config.runtimeConfig) {
    njpConfig.publicRuntimeConfig = Object.fromEntries(
      Object.keys(config.runtimeConfig).map(name => [
        name,
        config.runtimeConfig[name].default
      ])
    );
  }
  if (config.serverRuntimeConfig) {
    njpConfig.serverRuntimeConfig = Object.fromEntries(
      Object.keys(config.serverRuntimeConfig).map(name => [
        name,
        config.serverRuntimeConfig[name].default
      ])
    );
  }

  await writeFile(
    join(dir, file_njpConfigJson),
    JSON.stringify(njpConfig, null, 2)
  );
};

export const updateNjpConfig = async (
  dir: string,
  moduleIndicators: string[],
  validateOnly = false
): Promise<void> => {
  const modules = await getModuleInfo(dir, moduleIndicators);
  const configToModulesMap = await getConfigToModulesMap(modules);

  const dependencyMap: Record<string, string[]> = {};
  modules.forEach(module => {
    dependencyMap[module.name] = module.dependencies;
  });

  const errors: Error[] = [];

  const combinedConfig: Config = {
    env: {},
    imageDomains: configToModulesMap.imageDomains,
    runtimeConfig: {},
    serverRuntimeConfig: {}
  };

  const keysToBeResolved: (keyof Omit<ConfigToModuleMap, "imageDomains">)[] = [
    "env",
    "runtimeConfig",
    "serverRuntimeConfig"
  ];

  keysToBeResolved.forEach(configKey => {
    Object.keys(configToModulesMap[configKey]).forEach(configName => {
      let config = null;
      if (configToModulesMap[configKey][configName].length == 1) {
        config = configToModulesMap[configKey][configName][0].config;
      } else {
        const moduleNamesToResolve = configToModulesMap[configKey][
          configName
        ].map(m => m.moduleName);
        try {
          const moduleName = resolve(moduleNamesToResolve, dependencyMap);
          config = configToModulesMap[configKey][configName].filter(
            m => m.moduleName == moduleName
          )[0].config;
        } catch (e) {
          errors.push(
            new Error(
              `Error while resolving (${moduleNamesToResolve.join(
                ", "
              )}) modules for the ${configKey} '${configName}': ${e.message}`
            )
          );
        }
      }
      if (config) {
        combinedConfig[configKey][configName] = config;
      }
    });
  });

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }

  if (!validateOnly) {
    await generateDotEnvFile(dir, combinedConfig);
    await generateNjpConfigFile(dir, combinedConfig);
  }
};
