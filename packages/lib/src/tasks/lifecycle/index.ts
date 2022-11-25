import { ModuleHandler } from "../../utils/moduleHandler";
import { loadLifeCycleHooks as _loadLifeCycleHooks } from "../../utils/lifeCycle/load";
import { KeywordDefinition, Mode, LifeCycle } from "somod-types";
import { bundle } from "../../utils/lifeCycle/bundle";
import { ServerlessTemplateHandler } from "../../utils/serverless/serverlessTemplate/serverlessTemplate";

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
  const serverlessTemplateHandler =
    ServerlessTemplateHandler.getServerlessTemplateHandler();
  await plugin.prebuild(dir, moduleHandler, serverlessTemplateHandler, mode);
};

/* istanbul ignore next */
export const runBuildLifeCycleHook = async (
  dir: string,
  plugin: LifeCycle,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  const serverlessTemplateHandler =
    ServerlessTemplateHandler.getServerlessTemplateHandler();
  await plugin.build(dir, moduleHandler, serverlessTemplateHandler, mode);
};

/* istanbul ignore next */
export const runPreprepareLifeCycleHook = async (
  dir: string,
  plugin: LifeCycle,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  const serverlessTemplateHandler =
    ServerlessTemplateHandler.getServerlessTemplateHandler();
  await plugin.preprepare(dir, moduleHandler, serverlessTemplateHandler, mode);
};

/* istanbul ignore next */
export const runPrepareLifeCycleHook = async (
  dir: string,
  plugin: LifeCycle,
  mode: Mode
) => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  const serverlessTemplateHandler =
    ServerlessTemplateHandler.getServerlessTemplateHandler();
  await plugin.prepare(dir, moduleHandler, serverlessTemplateHandler, mode);
};

/* istanbul ignore next */
export const bundleLifeCycleHook = async (dir: string, verbose = false) => {
  await bundle(dir, verbose);
};
