import { ModuleHandler } from "../../utils/moduleHandler";
import { loadLifeCycleHooks as _loadLifeCycleHooks } from "../../utils/lifeCycle/load";
import { KeywordDefinition, Mode, LifeCycle } from "somod-types";
import {
  getNodeRuntimeVersion,
  getSAMResourceLogicalId,
  getSAMResourceName,
  getSAMOutputName,
  getParameterNameFromSAMOutputName
} from "../../utils/serverless/utils";
import { bundle } from "../../utils/lifeCycle/bundle";

const utils = {
  getNodeRuntimeVersion,
  getSAMResourceLogicalId,
  getSAMResourceName,
  getSAMOutputName,
  getParameterNameFromSAMOutputName
};

export const loadLifeCycleHooks = async () => {
  const lcHooks = await _loadLifeCycleHooks();
  const namespaceLoaders = lcHooks
    .filter(l => l.lifeCycle.namespaceLoader)
    .map(l => l.lifeCycle.namespaceLoader);
  const prebuild = lcHooks.filter(l => l.lifeCycle.prebuild).reverse();
  const build = lcHooks.filter(l => l.lifeCycle.build);
  const preprepare = lcHooks.filter(l => l.lifeCycle.preprepare).reverse();
  const prepare = lcHooks.filter(l => l.lifeCycle.prepare);

  const uiKeywords: KeywordDefinition[] = [];
  const serverlessKeywords: KeywordDefinition[] = [];

  lcHooks.forEach(l => {
    if (l.lifeCycle.keywords?.uiConfig) {
      uiKeywords.push(...l.lifeCycle.keywords.uiConfig);
    }
    if (l.lifeCycle.keywords?.serverless) {
      serverlessKeywords.push(...l.lifeCycle.keywords.serverless);
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
export const runPrebuildLifeCycleHook = async (
  dir: string,
  plugin: LifeCycle,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  await plugin.prebuild(dir, moduleHandler, mode, utils);
};

/* istanbul ignore next */
export const runBuildLifeCycleHook = async (
  dir: string,
  plugin: LifeCycle,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  await plugin.build(dir, moduleHandler, mode, utils);
};

/* istanbul ignore next */
export const runPreprepareLifeCycleHook = async (
  dir: string,
  plugin: LifeCycle,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  await plugin.preprepare(dir, moduleHandler, mode, utils);
};

/* istanbul ignore next */
export const runPrepareLifeCycleHook = async (
  dir: string,
  plugin: LifeCycle,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  await plugin.prepare(dir, moduleHandler, mode, utils);
};

export const bundleLifeCycleHook = async (dir: string, verbose = false) => {
  await bundle(dir, verbose);
};
