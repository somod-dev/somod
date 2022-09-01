import { readJsonFileStore } from "@solib/cli-base";
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
import { getKeyword, getKeywordPaths } from "../keywords";
import { Module, ModuleHandler, NamespaceLoader } from "../moduleHandler";
import { listAllParameters } from "../parameters/namespace";
import { readYamlFileStore } from "../yamlFileStore";

export const KeywordSomodParameter = "SOMOD::Parameter";

export type SomodParameter = {
  [KeywordSomodParameter]: string;
};

// this must match the @somod/ui-config-schema/schemas/index.json
export type Config = {
  env?: Record<string, SomodParameter>;
  imageDomains?: (string | SomodParameter)[];
  publicRuntimeConfig?: Record<string, SomodParameter>;
  serverRuntimeConfig?: Record<string, SomodParameter>;
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

const buildConfigYaml = async (dir: string): Promise<void> => {
  const configYamlPath = join(dir, path_ui, file_configYaml);
  const yamlContentAsJson = (await readYamlFileStore(configYamlPath)) || {};

  const configJsonPath = join(dir, path_build, path_ui, file_configJson);

  await mkdir(dirname(configJsonPath), { recursive: true });
  await writeFile(configJsonPath, JSON.stringify(yamlContentAsJson));
};

const validate = async () => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  const rootModuleNode = await moduleHandler.getRoodModuleNode();

  const config = await loadConfig(rootModuleNode.module);

  const parameters = Object.keys(await listAllParameters());

  const keywordPaths = getKeywordPaths(config, [KeywordSomodParameter]);

  const missingParameters: string[] = [];
  keywordPaths[KeywordSomodParameter].forEach(somodParameterPath => {
    const somodParameter = getKeyword(
      config,
      somodParameterPath
    ) as SomodParameter;

    const parameter = somodParameter[KeywordSomodParameter];
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

export const buildConfig = async (dir: string) => {
  await validate();
  await buildConfigYaml(dir);
};

export const generateCombinedConfig = async (): Promise<Config> => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  const allModules = await moduleHandler.listModules();

  const moduleNameToConfigMap: Record<string, Config> = {};
  await Promise.all(
    allModules.map(async moduleNode => {
      moduleNameToConfigMap[moduleNode.module.name] = await loadConfig(
        moduleNode.module
      );
    })
  );

  const namespaces = await moduleHandler.getNamespaces();

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
