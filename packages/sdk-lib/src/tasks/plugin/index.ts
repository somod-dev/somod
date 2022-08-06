import { ModuleHandler } from "../../utils/moduleHandler";
import { Mode, Plugin } from "../../utils/plugin/types";
import { loadPlugins as _loadPlugins } from "../../utils/plugin/loadPlugins";
import {
  getNodeRuntimeVersion,
  getParameterNameFromSAMOutputName,
  getSAMOutputName,
  getSAMResourceLogicalId
} from "../../utils/serverless/utils";

export const loadPlugins = async (dir: string) => {
  const plugins = await _loadPlugins(dir);
  const init = plugins.filter(p => p.plugin.init);
  const namespace = plugins.filter(p => p.plugin.namespaceLoader);
  const prebuild = plugins.filter(p => p.plugin.prebuild).reverse();
  const build = plugins.filter(p => p.plugin.build);
  const preprepare = plugins.filter(p => p.plugin.preprepare).reverse();
  const prepare = plugins.filter(p => p.plugin.prepare);

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
    init,
    namespace,
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

export const runPluginInit = async (
  dir: string,
  plugin: Plugin,
  mode: Mode
) => {
  await plugin.init(dir, mode);
};

export const loadPluginNamespace = async (
  dir: string,
  plugin: Plugin,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir);
  await moduleHandler.getNamespaces(async module => {
    plugin.namespaceLoader(module, mode);
  });
};

export const runPluginPrebuild = async (
  dir: string,
  plugin: Plugin,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir);
  await plugin.prebuild(dir, moduleHandler, mode);
};

export const runPluginBuild = async (
  dir: string,
  plugin: Plugin,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir);
  await plugin.build(dir, moduleHandler, mode);
};

export const runPluginPreprepare = async (
  dir: string,
  plugin: Plugin,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir);
  await plugin.preprepare(dir, moduleHandler, mode);
};

export const runPluginPrepare = async (
  dir: string,
  plugin: Plugin,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir);
  await plugin.prepare(dir, moduleHandler, mode, {
    getNodeRuntimeVersion,
    getParameterNameFromSAMOutputName,
    getSAMOutputName,
    getSAMResourceLogicalId
  });
};
