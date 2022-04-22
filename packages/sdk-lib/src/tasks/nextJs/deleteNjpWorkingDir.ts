import { join } from "path";
import rimraf from "rimraf";
import { path_njp_working_dir } from "../../utils/constants";

export const deleteNjpWorkingDir = (dir: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    rimraf(join(dir, path_njp_working_dir), { disableGlob: true }, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
