import { existsSync } from "fs";
import { join } from "path";
import { IContext } from "somod-types";
import { file_configYaml, path_ui } from "../../utils/constants";
import { build } from "../../utils/nextJs/config";

export const buildUiConfigYaml = async (context: IContext): Promise<void> => {
  const configYamlPath = join(context.dir, path_ui, file_configYaml);
  if (existsSync(configYamlPath)) {
    await build(context.dir);
  }
};
