import { existsSync } from "fs";
import { join } from "path";
import { file_templateYaml, path_serverless } from "../../utils/constants";
import { ModuleHandler } from "../../utils/moduleHandler";
import { loadServerlessTemplateMap } from "../../utils/serverless/serverlessTemplate/serverlessTemplate";
import { validateServerlessTemplate as _validateServerlessTemplate } from "../../utils/serverless/serverlessTemplate/validate";

export const validateServerlessTemplate = async (
  dir: string
): Promise<void> => {
  const templateYamlPath = join(dir, path_serverless, file_templateYaml);
  if (existsSync(templateYamlPath)) {
    const moduleHandler = ModuleHandler.getModuleHandler();
    const moduleNodes = await moduleHandler.listModules();
    const rootModuleName = moduleNodes[0].module.name;
    const moduleTemplateMap = await loadServerlessTemplateMap(
      moduleNodes.map(m => m.module)
    );
    await _validateServerlessTemplate(dir, rootModuleName, moduleTemplateMap);
  }
};
