import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, normalize, relative } from "path";
import Watchpack from "watchpack";
import { path_pages, path_pagesData, path_ui } from "../../utils/constants";
import { addPageExtention } from "../../utils/nextJs/pages";

export const watchRootModulePagesData = async (
  dir: string
): Promise<() => void> => {
  const watchDir = join(dir, path_ui, path_pagesData);
  const wp = new Watchpack({});
  const normalizedWatchDir = normalize(watchDir);
  let watchingParent = false;
  let dirWatch = normalizedWatchDir;
  while (!existsSync(dirWatch) && dirWatch.length > 0) {
    dirWatch = join(dirWatch, "..");
  }
  watchingParent = dirWatch != normalizedWatchDir;
  wp.watch([], [dirWatch]);

  wp.on("change", (filePath: string) => {
    if (watchingParent) {
      if (filePath == normalizedWatchDir) {
        watchingParent = false;
        wp.watch([], [normalizedWatchDir]);
      }
      return;
    }
    const pageDataRelativePath = relative(watchDir, filePath);
    const page = pageDataRelativePath.substring(
      0,
      pageDataRelativePath.lastIndexOf(".")
    );
    try {
      const pageFullPath = addPageExtention(
        join(dir, path_ui, path_pages, page)
      );
      writeFileSync(pageFullPath, readFileSync(pageFullPath, "utf8")); // this triggers page update
    } catch (e) {
      if (e?.message?.startsWith("Could not find supported extention for")) {
        // ignore if corresponding page does not exist
      } else {
        throw e;
      }
    }
  });

  return () => {
    wp.close();
  };
};
