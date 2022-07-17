import { existsSync } from "fs";
import { join } from "path";
import { file_templateYaml, path_serverless } from "../../utils/constants";
import { buildTemplateYaml } from "../../utils/serverless/buildTemplateYaml";

export const buildServerlessTemplate = async (dir: string): Promise<void> => {
  const templateYamlPath = join(dir, path_serverless, file_templateYaml);
  if (existsSync(templateYamlPath)) {
    await buildTemplateYaml(dir);
  }
};
