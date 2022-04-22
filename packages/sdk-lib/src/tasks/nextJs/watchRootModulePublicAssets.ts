import { existsSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { path_public, path_ui } from "../../utils/constants";
import { copyDirectory } from "@sodaru/cli-base";
import { exportRootModulePublicAsset } from "../../utils/publicAssets";
import watch from "../../utils/watch";
import { sync as rimrafSync } from "rimraf";

const createTempDir = (): string => {
  return mkdtempSync(join(tmpdir(), "sodaruPackageManagerLib-"));
};

export const watchRootModulePublicAssets = async (
  dir: string
): Promise<() => void> => {
  const backupDir = createTempDir();

  const publicAssetsDir = join(dir, path_public);

  if (existsSync(publicAssetsDir)) {
    await copyDirectory(publicAssetsDir, backupDir);
  }
  const closeWatch = watch(
    join(dir, path_ui, path_public),
    publicAssetsDir,
    file => {
      exportRootModulePublicAsset(dir, file).catch(err => {
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
