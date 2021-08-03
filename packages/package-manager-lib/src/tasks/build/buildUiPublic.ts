import { existsSync } from "fs";
import { join } from "path";
import { path_build, path_public, path_ui } from "../../utils/constants";
import { copyDirectory } from "../../utils/fileUtils";

export const buildUiPublic = async (dir: string): Promise<void> => {
  const source = join(dir, path_ui, path_public);
  const target = join(dir, path_build, path_ui, path_public);
  if (existsSync(source)) {
    await copyDirectory(source, target);
  }
};
