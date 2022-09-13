import { join } from "path";
import { file_templateYaml, path_serverless } from "../../utils/constants";
import { yamlSchemaValidator } from "../../utils/yamlSchemaValidator";
import serverlessTemplateValidator from "somod-schema/compiled/serverless-template";

export const validateSchema = async (dir: string): Promise<void> => {
  const templateYamlPath = join(dir, path_serverless, file_templateYaml);
  await yamlSchemaValidator(serverlessTemplateValidator, templateYamlPath);
};
