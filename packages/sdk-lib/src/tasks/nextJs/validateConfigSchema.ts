import { join } from "path";
import {
  defaultNjpConfigSchema,
  file_configYaml,
  path_ui
} from "../../utils/constants";
import { yamlSchemaValidator } from "../../utils/yamlSchemaValidator";

export const validateConfigSchema = async (dir: string): Promise<void> => {
  await yamlSchemaValidator(
    defaultNjpConfigSchema,
    join(dir, path_ui, file_configYaml),
    dir
  );
};
