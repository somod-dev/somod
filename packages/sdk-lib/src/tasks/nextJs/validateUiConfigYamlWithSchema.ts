import { join } from "path";
import {
  defaultUiConfigSchema,
  file_configYaml,
  path_ui
} from "../../utils/constants";
import { yamlSchemaValidator } from "../../utils/yamlSchemaValidator";

export const validateUiConfigYamlWithSchema = async (
  dir: string
): Promise<void> => {
  await yamlSchemaValidator(
    defaultUiConfigSchema,
    join(dir, path_ui, file_configYaml),
    dir
  );
};
