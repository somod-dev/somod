import { join } from "path";
import { file_parametersYaml } from "../../utils/constants";
import { yamlSchemaValidator } from "../../utils/yamlSchemaValidator";
import parametersValidator from "somod-schema/compiled/parameters";
import { IContext } from "somod-types";
import { existsSync } from "fs";

export const validateSchema = async (context: IContext): Promise<void> => {
  const parametersPath = join(context.dir, file_parametersYaml);
  if (existsSync(parametersPath)) {
    await yamlSchemaValidator(parametersValidator, parametersPath);
  }
};
