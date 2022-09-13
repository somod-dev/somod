import { existsSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { path_pages, path_pagesData, path_ui } from "../../utils/constants";
import { copyDirectory } from "nodejs-file-utils";
import { linkPage, removeExtension } from "../../utils/nextJs/pages";
import watch from "../../utils/watch";
import { sync as rimrafSync } from "rimraf";

const createTempDir = (): string => {
  return mkdtempSync(join(tmpdir(), "somod-"));
};

export const watchRootModulePages = async (
  dir: string
): Promise<() => void> => {
  const backupDir = createTempDir();

  const pagesDir = join(dir, path_pages);

  if (existsSync(pagesDir)) {
    await copyDirectory(pagesDir, backupDir);
  }
  const closeWatch = watch(
    join(dir, path_ui, path_pages),
    pagesDir,
    backupDir,
    (sourcePage, destinationPage) => {
      linkPage(
        join(dir, path_ui, path_pages, sourcePage),
        join(
          dir,
          path_ui,
          path_pagesData,
          sourcePage.substring(0, sourcePage.lastIndexOf(".")) + ".ts"
        ),
        join(dir, path_pages, destinationPage)
      ).catch(err => {
        // eslint-disable-next-line no-console
        console.error(err);
      });
    },
    page => {
      return removeExtension(page) + ".ts";
    }
  );
  return () => {
    rimrafSync(backupDir);
    closeWatch();
  };
};
