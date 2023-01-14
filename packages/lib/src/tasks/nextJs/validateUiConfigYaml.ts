import { IContext } from "somod-types";
import { existsSync } from "fs";
import { join } from "path";
import { file_configYaml, path_ui } from "../../utils/constants";
import { validate } from "../../utils/nextJs/config";

export const validateUiConfigYaml = async (
  context: IContext
): Promise<void> => {
  const configYamlPath = join(context.dir, path_ui, file_configYaml);
  if (existsSync(configYamlPath)) {
    await validate(context);
  }
};
