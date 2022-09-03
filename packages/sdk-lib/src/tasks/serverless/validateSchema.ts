import { join } from "path";
import {
  defaultServerlessTemplateSchema,
  file_templateYaml,
  path_serverless
} from "../../utils/constants";
import { yamlSchemaValidator } from "../../utils/yamlSchemaValidator";

export const validateSchema = async (dir: string): Promise<void> => {
  const templateYamlPath = join(dir, path_serverless, file_templateYaml);
  await yamlSchemaValidator(
    defaultServerlessTemplateSchema,
    templateYamlPath,
    dir
  );
};
