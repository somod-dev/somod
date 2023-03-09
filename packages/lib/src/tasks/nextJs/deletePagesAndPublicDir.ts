import { join } from "path";
import rimraf from "rimraf";
import { IContext } from "somod-types";
import { path_pages, path_public } from "../../utils/constants";

const rimrafAsync = (dirToBeDeleted: string) => {
  return new Promise<void>((resolve, reject) => {
    rimraf(dirToBeDeleted, { disableGlob: true }, err => {
      /* istanbul ignore if reason: its ok here */
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const deletePagesAndPublicDir = async (context: IContext) => {
  await rimrafAsync(join(context.dir, path_pages));
  await rimrafAsync(join(context.dir, path_public));
};
