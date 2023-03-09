import { existsSync } from "fs";
import { join } from "path";
import { IContext } from "somod-types";
import { file_parametersYaml } from "../../utils/constants";
import { build } from "../../utils/parameters/build";

export const buildParameters = async (context: IContext): Promise<void> => {
  if (existsSync(join(context.dir, file_parametersYaml))) {
    await build(context);
  }
};
