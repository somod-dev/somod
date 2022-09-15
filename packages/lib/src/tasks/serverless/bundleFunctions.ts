import { ModuleHandler } from "../../utils/moduleHandler";
import { bundleFunctions as _bundleFunctions } from "../../utils/serverless/bundleFunctions";
import { loadServerlessTemplateMap } from "../../utils/serverless/serverlessTemplate/serverlessTemplate";

export const bundleFunctions = async (
  dir: string,
  verbose = false,
  sourcemap = false
) => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  const moduleNodes = await moduleHandler.listModules();
  const moduleTemplateMap = await loadServerlessTemplateMap(
    moduleNodes.map(m => m.module)
  );
  await _bundleFunctions(dir, moduleTemplateMap, verbose, sourcemap);
};
