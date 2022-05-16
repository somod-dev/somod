import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { load } from "js-yaml";
import { join } from "path";
import {
  file_configJson,
  file_configYaml,
  path_build,
  path_ui
} from "../../utils/constants";

export const buildUiConfigYaml = async (dir: string): Promise<void> => {
  const configYamlPath = join(dir, path_ui, file_configYaml);
  if (existsSync(configYamlPath)) {
    const yamlContent = await readFile(configYamlPath, {
      encoding: "utf8"
    });
    const yamlContentAsJson = load(yamlContent) || {};

    await mkdir(join(dir, path_build, path_ui), { recursive: true });
    await writeFile(
      join(dir, path_build, path_ui, file_configJson),
      JSON.stringify(yamlContentAsJson, null, 2)
    );
  }
};
