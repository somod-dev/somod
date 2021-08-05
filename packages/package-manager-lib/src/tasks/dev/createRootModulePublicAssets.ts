import { existsSync } from "fs";
import { join } from "path";
import { path_public, path_ui } from "../../utils/constants";
import { listFiles } from "../../utils/fileUtils";
import { exportRootModulePublicAsset } from "../../utils/publicAssets";

export const createRootModulePublicAssets = async (
  dir: string
): Promise<void> => {
  const uiPublicDir = join(dir, path_ui, path_public);
  if (existsSync(uiPublicDir)) {
    const publicAssets = await listFiles(uiPublicDir);
    await Promise.all(
      publicAssets.map(async page => {
        await exportRootModulePublicAsset(dir, page);
      })
    );
  }
};
