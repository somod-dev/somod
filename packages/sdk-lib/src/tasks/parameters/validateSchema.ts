import { join } from "path";
import {
  defaultParametersSchema,
  file_parametersYaml
} from "../../utils/constants";
import { yamlSchemaValidator } from "../../utils/yamlSchemaValidator";

export const validateSchema = async (dir: string): Promise<void> => {
  await yamlSchemaValidator(
    defaultParametersSchema,
    join(dir, file_parametersYaml),
    dir
  );
};
