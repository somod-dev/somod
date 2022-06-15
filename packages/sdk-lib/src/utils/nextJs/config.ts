import { existsSync } from "fs";
import { JSONSchema7 } from "json-schema";
import { join } from "path";
import {
  file_configJson,
  namespace_env_config,
  namespace_runtime_config,
  namespace_serverruntime_config,
  path_build,
  path_ui
} from "../constants";
import { readJsonFileStore } from "@solib/cli-base";
import { Module } from "../moduleHandler";

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
  globalCss?: string[];
  env?: Record<string, EnvConfig>;
  imageDomains?: string[];
  runtimeConfig?: Record<string, RuntimeConfig>;
  serverRuntimeConfig?: Record<string, RuntimeConfig>;
};

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
    return await readJsonFileStore(configPath);
  } else {
    return {};
  }
};

export const loadConfigNamespaces = async (module: Module) => {
  if (
    !module.namespaces[namespace_env_config] ||
    !module.namespaces[namespace_runtime_config] ||
    !module.namespaces[namespace_serverruntime_config]
  ) {
    const config = await readConfigJson(module.packageLocation);

    module.namespaces[namespace_env_config] = Object.keys(config.env || {});
    module.namespaces[namespace_runtime_config] = Object.keys(
      config.runtimeConfig || {}
    );
    module.namespaces[namespace_serverruntime_config] = Object.keys(
      config.serverRuntimeConfig || {}
    );
  }
};
