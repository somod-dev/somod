import { join } from "path";
import rimraf from "rimraf";
import { path_build } from "../../utils/constants";

export const deleteBuildDir = (dir: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    rimraf(join(dir, path_build), { disableGlob: true }, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
