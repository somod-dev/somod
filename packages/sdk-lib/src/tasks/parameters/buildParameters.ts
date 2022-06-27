import { existsSync } from "fs";
import { join } from "path";
import { file_parametersYaml } from "../../utils/constants";
import { build } from "../../utils/parameters/build";

export const buildParameters = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  if (existsSync(join(dir, file_parametersYaml))) {
    await build(dir, moduleIndicators);
  }
};
