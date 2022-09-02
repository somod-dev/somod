import { ModuleHandler } from "../../utils/moduleHandler";
import { Mode, Plugin } from "../../utils/plugin/types";
import { loadPlugins as _loadPlugins } from "../../utils/plugin/loadPlugins";
import {
  getNodeRuntimeVersion,
  getParameterNameFromSAMOutputName,
  getSAMOutputName,
  getSAMResourceLogicalId
} from "../../utils/serverless/utils";
import { KeywordDefinition } from "../../utils/keywords/types";

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

  const compilerOptions = plugins.reduce((agg, p) => {
    return { ...agg, ...p.plugin.tsconfig?.compilerOptions };
  }, {} as Plugin["tsconfig"]["compilerOptions"]);

  const include = plugins.reduce((agg, p) => {
    return [...agg, ...(p.plugin.tsconfig?.include || [])];
  }, [] as Plugin["tsconfig"]["include"]);

  const gitIgnore = plugins.reduce((agg, p) => {
    return [...agg, ...(p.plugin.ignorePatterns?.git || [])];
  }, []) as string[];
  const eslintIgnore = plugins.reduce((agg, p) => {
    return [...agg, ...(p.plugin.ignorePatterns?.eslint || [])];
  }, []) as string[];
  const prettierIgnore = plugins.reduce((agg, p) => {
    return [...agg, ...(p.plugin.ignorePatterns?.prettier || [])];
  }, []) as string[];

  return {
    namespaceLoaders,
    uiKeywords,
    serverlessKeywords,
    prebuild,
    build,
    preprepare,
    prepare,
    tsconfig: {
      compilerOptions,
      include
    },
    ignorePatterns: {
      git: gitIgnore,
      eslint: eslintIgnore,
      prettier: prettierIgnore
    }
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
    getParameterNameFromSAMOutputName,
    getSAMOutputName,
    getSAMResourceLogicalId
  });
};
