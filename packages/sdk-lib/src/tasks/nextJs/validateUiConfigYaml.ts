import { existsSync } from "fs";
import { join } from "path";
import { file_configYaml, path_ui } from "../../utils/constants";
import { KeywordDefinition } from "../../utils/keywords/types";
import { validate } from "../../utils/nextJs/config";

export const validateUiConfigYaml = async (
  dir: string,
  pluginKeywords: KeywordDefinition[] = []
): Promise<void> => {
  const configYamlPath = join(dir, path_ui, file_configYaml);
  if (existsSync(configYamlPath)) {
    await validate(dir, pluginKeywords);
  }
};
