import { copyFile, mkdir } from "fs/promises";
import { dirname, join } from "path";
import {
  namespace_public,
  path_build,
  path_public,
  path_ui
} from "../../utils/constants";
import { ModuleHandler } from "../../utils/moduleHandler";
import { loadNamespaces } from "./namespace";

export const createPublicAssets = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir, moduleIndicators);

  const namespaces = await loadNamespaces(dir, moduleIndicators);

  const allPublicAssets = namespaces[namespace_public];

  await Promise.all(
    Object.keys(allPublicAssets).map(async publicAsset => {
      const moduleName = allPublicAssets[publicAsset];
      const moduleNode = await moduleHandler.getModule(moduleName);
      const packageLocation = moduleNode.module.packageLocation;

      const publicAssetPath = join(dir, path_public, publicAsset);
      const publicAssetDir = dirname(publicAssetPath);
      await mkdir(publicAssetDir, { recursive: true });
      await copyFile(
        join(packageLocation, path_build, path_ui, path_public, publicAsset),
        publicAssetPath
      );
    })
  );
};
