import { ModuleHandler } from "../../utils/moduleHandler";
import { bundleFunctionLayers as _bundleFunctionLayers } from "../../utils/serverless/bundleFunctionLayers";
import { loadServerlessTemplateMap } from "../../utils/serverless/serverlessTemplate/serverlessTemplate";

export const bundleFunctionLayers = async (dir: string, verbose = false) => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  const moduleNodes = await moduleHandler.listModules();
  const moduleTemplateMap = await loadServerlessTemplateMap(
    moduleNodes.map(m => m.module)
  );
  await _bundleFunctionLayers(dir, moduleTemplateMap, verbose);
};
