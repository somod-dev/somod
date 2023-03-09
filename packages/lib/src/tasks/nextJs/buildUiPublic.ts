import { existsSync } from "fs";
import { join } from "path";
import { path_build, path_public, path_ui } from "../../utils/constants";
import { copyDirectory } from "nodejs-file-utils";
import { IContext } from "somod-types";

export const buildUiPublic = async (context: IContext): Promise<void> => {
  const source = join(context.dir, path_ui, path_public);
  const target = join(context.dir, path_build, path_ui, path_public);
  if (existsSync(source)) {
    await copyDirectory(source, target);
  }
};
