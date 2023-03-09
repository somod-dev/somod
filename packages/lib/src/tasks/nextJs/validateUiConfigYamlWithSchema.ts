import { join } from "path";
import { file_configYaml, path_ui } from "../../utils/constants";
import { yamlSchemaValidator } from "../../utils/yamlSchemaValidator";
import uiConfigValidator from "somod-schema/compiled/ui-config";
import { IContext } from "somod-types";
import { existsSync } from "fs";

export const validateUiConfigYamlWithSchema = async (
  context: IContext
): Promise<void> => {
  const configFilePath = join(context.dir, path_ui, file_configYaml);
  if (existsSync(configFilePath)) {
    await yamlSchemaValidator(uiConfigValidator, configFilePath);
  }
};
