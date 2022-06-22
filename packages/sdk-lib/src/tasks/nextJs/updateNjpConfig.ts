import { writeFile } from "fs/promises";
import { join } from "path";
import {
  file_dotenv,
  namespace_env_config,
  namespace_runtime_config,
  namespace_serverruntime_config
} from "../../utils/constants";
import { ModuleHandler } from "../../utils/moduleHandler";
import { Config, readConfigJson } from "../../utils/nextJs/config";
import { loadNamespaces } from "./namespace";

// TODO: remove this
const file_njpConfigJson = "njp.config.json";

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
  moduleIndicators: string[]
): Promise<void> => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir, moduleIndicators);

  const namespaces = await loadNamespaces(dir, moduleIndicators);

  const allModules = await moduleHandler.listModules();

  const combinedConfig: Config = {
    globalCss: [],
    env: {},
    imageDomains: [],
    runtimeConfig: {},
    serverRuntimeConfig: {}
  };

  const configMap: Record<string, Config> = {};

  await Promise.all(
    allModules.map(async moduleNode => {
      const config = await readConfigJson(moduleNode.module.packageLocation);
      configMap[moduleNode.module.name] = config;
      combinedConfig.globalCss.push(...config.globalCss);
      combinedConfig.imageDomains.push(...config.imageDomains);
    })
  );

  const allEnvConfig = namespaces[namespace_env_config];
  const allRuntimeConfig = namespaces[namespace_runtime_config];
  const allServerRuntimeConfig = namespaces[namespace_serverruntime_config];

  Object.keys(allEnvConfig).map(envName => {
    const moduleName = allEnvConfig[envName];
    const env = configMap[moduleName].env[envName];
    combinedConfig.env[envName] = env;
  });

  Object.keys(allRuntimeConfig).map(runtimeConfigName => {
    const moduleName = allRuntimeConfig[runtimeConfigName];
    const runtimeConfig =
      configMap[moduleName].runtimeConfig[runtimeConfigName];
    combinedConfig.runtimeConfig[runtimeConfigName] = runtimeConfig;
  });

  Object.keys(allServerRuntimeConfig).map(runtimeConfigName => {
    const moduleName = allServerRuntimeConfig[runtimeConfigName];
    const runtimeConfig =
      configMap[moduleName].serverRuntimeConfig[runtimeConfigName];
    combinedConfig.serverRuntimeConfig[runtimeConfigName] = runtimeConfig;
  });

  await generateDotEnvFile(dir, combinedConfig);
  await generateNjpConfigFile(dir, combinedConfig);
};
