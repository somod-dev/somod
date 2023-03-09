import { join } from "path";
import rimraf from "rimraf";
import { IContext } from "somod-types";
import { path_build } from "../../utils/constants";

export const deleteBuildDir = (context: IContext): Promise<void> => {
  return new Promise((resolve, reject) => {
    rimraf(join(context.dir, path_build), { disableGlob: true }, err => {
      /* istanbul ignore if reason: its ok here */
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
