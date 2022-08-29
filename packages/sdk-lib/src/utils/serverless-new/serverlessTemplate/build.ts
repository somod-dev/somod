import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import {
  file_templateJson,
  path_build,
  path_serverless
} from "../../constants";
import { ServerlessTemplate } from "../types";

/**
 * Creates `build/serverless/template.json` from `serverless/template.yaml`.
 *
 * Assumption is that `serverless/template.yaml` is present in root module
 */
export const buildServerlessTemplate = async (
  dir: string,
  rootServerlessTemplate: ServerlessTemplate
) => {
  const targetFilePath = join(
    dir,
    path_build,
    path_serverless,
    file_templateJson
  );
  await mkdir(dirname(targetFilePath), { recursive: true });
  await writeFile(targetFilePath, JSON.stringify(rootServerlessTemplate));
};
