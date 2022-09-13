import { existsSync } from "fs";
import { dirname, join } from "path";
import { file_packageJson } from "./utils/constants";

export const findRootDir = () => {
  let cwd = process.cwd();
  while (!existsSync(join(cwd, file_packageJson))) {
    const parentDir = dirname(cwd);
    if (parentDir == cwd) {
      throw new Error(
        "fatal: not a npm package (or any of the parent directories)"
      );
    }
    cwd = parentDir;
  }
  return cwd;
};
