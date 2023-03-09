import { mkdir, writeFile } from "fs/promises";
import { readYamlFileStore } from "nodejs-file-utils";
import { dirname, join } from "path";
import {
  file_templateJson,
  file_templateYaml,
  path_build,
  path_serverless
} from "../../constants";

/**
 * Creates `build/serverless/template.json` from `serverless/template.yaml`.
 *
 */
export const build = async (dir: string) => {
  const sourcePath = join(dir, path_serverless, file_templateYaml);
  const template = await readYamlFileStore(sourcePath);
  const targetFilePath = join(
    dir,
    path_build,
    path_serverless,
    file_templateJson
  );
  await mkdir(dirname(targetFilePath), { recursive: true });
  await writeFile(targetFilePath, JSON.stringify(template));
};
