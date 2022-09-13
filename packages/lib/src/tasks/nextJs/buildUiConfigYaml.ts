import { existsSync } from "fs";
import { join } from "path";
import { file_configYaml, path_ui } from "../../utils/constants";
import { build } from "../../utils/nextJs/config";

export const buildUiConfigYaml = async (dir: string): Promise<void> => {
  const configYamlPath = join(dir, path_ui, file_configYaml);
  if (existsSync(configYamlPath)) {
    await build(dir);
  }
};
