import { ModuleHandler } from "../moduleHandler";
import { listAllParameters } from "../parameters/namespace";
import { build as buildFunction } from "./keywords/function";
import { build as buildFunctionLayerLibraries } from "./keywords/functionLayerLibraries";
import {
  buildRootSLPTemplate,
  loadServerlessTemplate,
  validateKeywords
} from "./slpTemplate";

export const buildTemplateYaml = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir, moduleIndicators);
  const allModules = await moduleHandler.listModules();

  const serverlessTemplate = await loadServerlessTemplate(allModules);

  const rootModuleNode = allModules[0];

  if (serverlessTemplate[rootModuleNode.module.name]) {
    const rootSlpTemplate = serverlessTemplate[rootModuleNode.module.name];
    delete serverlessTemplate[rootModuleNode.module.name];

    const allParameters = await listAllParameters(dir, moduleIndicators);
    await validateKeywords(rootSlpTemplate, serverlessTemplate, allParameters);

    await buildRootSLPTemplate(rootModuleNode);

    await buildFunction(rootSlpTemplate);
    await buildFunctionLayerLibraries(rootSlpTemplate);
  }
};
