import { join } from "path";
import rimraf from "rimraf";
import { path_slpWorkingDir } from "../../utils/constants";

export const deleteSlpWorkingDir = (dir: string): Promise<void> => {
  const slpWorkingDir = join(dir, path_slpWorkingDir);

  return new Promise((resolve, reject) => {
    rimraf(slpWorkingDir, { disableGlob: true }, e => {
      if (e) {
        reject(e);
      } else {
        resolve();
      }
    });
  });
};
