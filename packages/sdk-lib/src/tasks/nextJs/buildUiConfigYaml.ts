import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import {
  file_configJson,
  file_configYaml,
  path_build,
  path_ui
} from "../../utils/constants";
import { readYamlFileStore } from "../../utils/yamlFileStore";

export const buildUiConfigYaml = async (dir: string): Promise<void> => {
  const configYamlPath = join(dir, path_ui, file_configYaml);
  if (existsSync(configYamlPath)) {
    const yamlContentAsJson = (await readYamlFileStore(configYamlPath)) || {};

    await mkdir(join(dir, path_build, path_ui), { recursive: true });
    await writeFile(
      join(dir, path_build, path_ui, file_configJson),
      JSON.stringify(yamlContentAsJson, null, 2)
    );
  }
};
