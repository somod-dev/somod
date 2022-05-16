import { join } from "path";
import {
  defaultServerlessTemplateSchema,
  file_templateYaml,
  key_serverlessSchema,
  path_serverless
} from "../../utils/constants";
import { read } from "../../utils/packageJson";
import { yamlSchemaValidator } from "../../utils/yamlSchemaValidator";

export const validateSchema = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  const schemaId = (packageJson[key_serverlessSchema] ||
    defaultServerlessTemplateSchema) as string;
  const templateYamlPath = join(dir, path_serverless, file_templateYaml);
  await yamlSchemaValidator(schemaId, templateYamlPath, dir);
};
