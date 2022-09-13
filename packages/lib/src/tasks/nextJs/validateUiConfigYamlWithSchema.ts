import { join } from "path";
import { file_configYaml, path_ui } from "../../utils/constants";
import { yamlSchemaValidator } from "../../utils/yamlSchemaValidator";
import uiConfigValidator from "somod-schema/compiled/ui-config";

export const validateUiConfigYamlWithSchema = async (
  dir: string
): Promise<void> => {
  await yamlSchemaValidator(
    uiConfigValidator,
    join(dir, path_ui, file_configYaml)
  );
};
