import { join } from "path";
import {
  namespace_public,
  path_build,
  path_public,
  path_ui
} from "../../utils/constants";
import { ModuleHandler } from "../../utils/moduleHandler";
import { linkAsset } from "../../utils/nextJs/publicAssets";
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

      const sourcePublicAssetPath = join(
        packageLocation,
        moduleNode.module.root ? "" : path_build,
        path_ui,
        path_public,
        publicAsset
      );

      const publicAssetPath = join(dir, path_public, publicAsset);

      await linkAsset(sourcePublicAssetPath, publicAssetPath);
    })
  );
};
