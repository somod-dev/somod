import { existsSync } from "fs";
import { join } from "path";
import { file_templateYaml, path_serverless } from "../../utils/constants";
import { buildTemplateJson } from "../../utils/serverlessTemplate";

export const buildServerlessTemplate = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  const templateYamlPath = join(dir, path_serverless, file_templateYaml);
  if (existsSync(templateYamlPath)) {
    await buildTemplateJson(dir, moduleIndicators);
  }
};