import { existsSync } from "fs";
import { join } from "path";
import { file_configYaml, path_ui } from "../../utils/constants";
import { buildConfig } from "../../utils/nextJs/config";

export const buildUiConfigYaml = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  const configYamlPath = join(dir, path_ui, file_configYaml);
  if (existsSync(configYamlPath)) {
    buildConfig(dir, moduleIndicators);
  }
};
