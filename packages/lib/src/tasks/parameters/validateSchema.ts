import { join } from "path";
import { file_parametersYaml } from "../../utils/constants";
import { yamlSchemaValidator } from "../../utils/yamlSchemaValidator";
import parametersValidator from "somod-schema/compiled/parameters";

export const validateSchema = async (dir: string): Promise<void> => {
  await yamlSchemaValidator(
    parametersValidator,
    join(dir, file_parametersYaml)
  );
};
