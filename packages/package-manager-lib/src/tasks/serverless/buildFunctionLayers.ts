import { existsSync } from "fs";
import { join, dirname } from "path";
import {
  path_build,
  path_serverless,
  path_function_layers
} from "../../utils/constants";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";

export const buildFunctionLayers = async (dir: string): Promise<void> => {
  const source = join(dir, path_serverless, path_function_layers);
  const target = join(dir, path_build, path_serverless, path_function_layers);
  if (existsSync(source)) {
    const files = await readdir(source);
    await Promise.all(
      files.map(async file => {
        const contentStr = await readFile(join(source, file), {
          encoding: "utf8"
        });
        const content = JSON.parse(contentStr);
        const targetFile = join(target, file);
        const targetDir = dirname(targetFile);
        await mkdir(targetDir, { recursive: true });
        await writeFile(targetFile, JSON.stringify(content));
      })
    );
  }
};
