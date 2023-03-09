import { join } from "path";
import { IContext } from "somod-types";
import { path_build, path_public, path_ui } from "../../utils/constants";
import {
  linkAsset,
  getPublicAssetToModuleMap
} from "../../utils/nextJs/publicAssets";

export const createPublicAssets = async (context: IContext): Promise<void> => {
  const allPublicAssets = getPublicAssetToModuleMap(context);

  await Promise.all(
    Object.keys(allPublicAssets).map(async publicAsset => {
      const moduleName = allPublicAssets[publicAsset];
      const moduleNode = context.moduleHandler.getModule(moduleName);
      const packageLocation = moduleNode.module.packageLocation;

      const sourcePublicAssetPath = join(
        packageLocation,
        moduleNode.module.root ? "" : path_build,
        path_ui,
        path_public,
        publicAsset
      );

      const publicAssetPath = join(context.dir, path_public, publicAsset);

      await linkAsset(sourcePublicAssetPath, publicAssetPath);
    })
  );
};
