import { existsSync } from "fs";
import { join } from "path";
import { file_templateYaml, path_serverless } from "../../utils/constants";
import { ModuleHandler } from "../../utils/moduleHandler";
import { bundleFunctionLayers as _bundleFunctionLayers } from "../../utils/serverless/bundleFunctionLayers";
import { loadServerlessTemplate } from "../../utils/serverless/serverlessTemplate/serverlessTemplate";

export const bundleFunctionLayers = async (dir: string, verbose = false) => {
  const templateYamlPath = join(dir, path_serverless, file_templateYaml);
  if (existsSync(templateYamlPath)) {
    const moduleHandler = ModuleHandler.getModuleHandler();
    const rootModuleNode = await moduleHandler.getRoodModuleNode();
    const rootModuleTemplate = await loadServerlessTemplate(
      rootModuleNode.module
    );
    await _bundleFunctionLayers(dir, rootModuleTemplate, verbose);
  }
};
