import { existsSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { path_pages, path_ui } from "../../utils/constants";
import { copyDirectory } from "@sodaru/cli-base";
import { exportRootModulePage } from "../../utils/pages";
import watch from "../../utils/watch";
import { sync as rimrafSync } from "rimraf";

const createTempDir = (): string => {
  return mkdtempSync(join(tmpdir(), "sodaruPackageManagerLib-"));
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
    file => {
      exportRootModulePage(dir, file).catch(err => {
        // eslint-disable-next-line no-console
        console.error(err);
      });
    },
    backupDir
  );
  return () => {
    rimrafSync(backupDir);
    closeWatch();
  };
};
