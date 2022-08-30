import { existsSync } from "fs";
import { join } from "path";
import { file_templateYaml, path_serverless } from "../../utils/constants";
import { ModuleHandler } from "../../utils/moduleHandler";
import { loadServerlessTemplate } from "../../utils/serverless/serverlessTemplate/serverlessTemplate";
import { buildServerlessTemplate as _buildServerlessTemplate } from "../../utils/serverless/serverlessTemplate/build";

export const buildServerlessTemplate = async (dir: string): Promise<void> => {
  const templateYamlPath = join(dir, path_serverless, file_templateYaml);
  if (existsSync(templateYamlPath)) {
    const moduleHandler = ModuleHandler.getModuleHandler(dir);
    const rootModuleNode = await moduleHandler.getRoodModuleNode();

    const rootModuleTemplate = await loadServerlessTemplate(
      rootModuleNode.module
    );
    await _buildServerlessTemplate(dir, rootModuleTemplate.template);
  }
};
