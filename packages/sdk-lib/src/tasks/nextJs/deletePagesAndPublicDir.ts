import { join } from "path";
import rimraf from "rimraf";
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

export const deletePagesAndPublicDir = async (dir: string) => {
  await rimrafAsync(join(dir, path_pages));
  await rimrafAsync(join(dir, path_public));
};
