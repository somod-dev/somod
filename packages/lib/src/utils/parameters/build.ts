import { mkdir, writeFile } from "fs/promises";
import { readYamlFileStore } from "nodejs-file-utils";
import { dirname, join } from "path";
import {
  file_parametersJson,
  file_parametersYaml,
  path_build
} from "../constants";

export const build = async (dir: string): Promise<void> => {
  const parameters =
    (await readYamlFileStore(join(dir, file_parametersYaml))) || {};
  const parametersBuildPath = join(dir, path_build, file_parametersJson);
  await mkdir(dirname(parametersBuildPath), { recursive: true });
  await writeFile(parametersBuildPath, JSON.stringify(parameters));
};
