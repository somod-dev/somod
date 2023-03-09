import { join } from "path";
import { file_templateYaml, path_serverless } from "../../utils/constants";
import { yamlSchemaValidator } from "../../utils/yamlSchemaValidator";
import serverlessTemplateValidator from "somod-schema/compiled/serverless-template";
import { IContext } from "somod-types";
import { existsSync } from "fs";

export const validateSchema = async (context: IContext): Promise<void> => {
  const templateYamlPath = join(
    context.dir,
    path_serverless,
    file_templateYaml
  );
  if (existsSync(templateYamlPath)) {
    await yamlSchemaValidator(serverlessTemplateValidator, templateYamlPath);
  }
};
