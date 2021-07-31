import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { path_git } from "../../utils/constants";

export const git = async (dir: string): Promise<void> => {
  if (!existsSync(join(dir, path_git))) {
    try {
      execSync(`git init`, {
        cwd: dir,
        windowsHide: true,
        stdio: "pipe"
      });
    } catch (e) {
      throw new Error(e.message);
    }
  }
};
