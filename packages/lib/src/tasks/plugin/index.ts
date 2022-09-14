import { ModuleHandler } from "../../utils/moduleHandler";
import { loadPlugins as _loadPlugins } from "../../utils/plugin/loadPlugins";
import { KeywordDefinition, Mode, Plugin } from "somod-types";
import {
  getNodeRuntimeVersion,
  getSAMResourceLogicalId,
  getSAMResourceName,
  getSAMOutputName,
  getParameterNameFromSAMOutputName
} from "../../utils/serverless/utils";

export const loadPlugins = async (dir: string) => {
  const plugins = await _loadPlugins(dir);
  const namespaceLoaders = plugins
    .filter(p => p.plugin.namespaceLoader)
    .map(p => p.plugin.namespaceLoader);
  const prebuild = plugins.filter(p => p.plugin.prebuild).reverse();
  const build = plugins.filter(p => p.plugin.build);
  const preprepare = plugins.filter(p => p.plugin.preprepare).reverse();
  const prepare = plugins.filter(p => p.plugin.prepare);

  const uiKeywords: KeywordDefinition[] = [];
  const serverlessKeywords: KeywordDefinition[] = [];

  plugins.forEach(p => {
    if (p.plugin.keywords?.uiConfig) {
      uiKeywords.push(...p.plugin.keywords.uiConfig);
    }
    if (p.plugin.keywords?.serverless) {
      serverlessKeywords.push(...p.plugin.keywords.serverless);
    }
  });

  return {
    namespaceLoaders,
    uiKeywords,
    serverlessKeywords,
    prebuild,
    build,
    preprepare,
    prepare
  };
};

/* istanbul ignore next */
export const runPluginPrebuild = async (
  dir: string,
  plugin: Plugin,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  await plugin.prebuild(dir, moduleHandler, mode);
};

/* istanbul ignore next */
export const runPluginBuild = async (
  dir: string,
  plugin: Plugin,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  await plugin.build(dir, moduleHandler, mode);
};

/* istanbul ignore next */
export const runPluginPreprepare = async (
  dir: string,
  plugin: Plugin,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  await plugin.preprepare(dir, moduleHandler, mode);
};

/* istanbul ignore next */
export const runPluginPrepare = async (
  dir: string,
  plugin: Plugin,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  await plugin.prepare(dir, moduleHandler, mode, {
    getNodeRuntimeVersion,
    getSAMResourceLogicalId,
    getSAMResourceName,
    getSAMOutputName,
    getParameterNameFromSAMOutputName
  });
};
