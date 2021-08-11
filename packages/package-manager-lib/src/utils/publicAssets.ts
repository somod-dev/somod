import { existsSync } from "fs";
import { copyFile, mkdir } from "fs/promises";
import { dirname, join } from "path";
import { path_build, path_public, path_ui } from "./constants";
import { listFiles } from "@sodaru-cli/base";
import { ModuleInfo } from "./moduleInfo";

export type PublicAssetToModulesMap = Record<
  string,
  { moduleName: string; packageLocation: string }[]
>;

const loadPublicAssets = async (packageLocation: string): Promise<string[]> => {
  const publicPath = join(packageLocation, path_build, path_ui, path_public);

  const publicAssets: string[] = existsSync(publicPath)
    ? await listFiles(publicPath)
    : [];

  return publicAssets;
};

export const getPublicAssetToModulesMap = async (
  modules: ModuleInfo[]
): Promise<PublicAssetToModulesMap> => {
  const allAssets: { module: ModuleInfo; publicAssets: string[] }[] =
    await Promise.all(
      modules.map(async module => {
        const publicAssets = await loadPublicAssets(module.packageLocation);
        return { module, publicAssets };
      })
    );

  const publicAssetToModulesMap: PublicAssetToModulesMap = {};

  allAssets.forEach(moduleAssets => {
    const module = moduleAssets.module;
    moduleAssets.publicAssets.forEach(publicAsset => {
      if (!publicAssetToModulesMap[publicAsset]) {
        publicAssetToModulesMap[publicAsset] = [];
      }
      publicAssetToModulesMap[publicAsset].push({
        moduleName: module.name,
        packageLocation: module.packageLocation
      });
    });
  });

  return publicAssetToModulesMap;
};

export const exportRootModulePublicAsset = async (
  dir: string,
  publicAsset: string
): Promise<void> => {
  const sourcePath = join(dir, path_ui, path_public, publicAsset);
  const targetPath = join(dir, path_public, publicAsset);

  const targetDir = dirname(targetPath);

  await mkdir(targetDir, { recursive: true });
  await copyFile(sourcePath, targetPath);
};
