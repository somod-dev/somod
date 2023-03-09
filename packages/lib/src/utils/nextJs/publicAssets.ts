import { existsSync } from "fs";
import { copyFile, mkdir } from "fs/promises";
import { listFiles } from "nodejs-file-utils";
import { dirname, join } from "path";
import { IContext, NamespaceLoader } from "somod-types";
import {
  namespace_public,
  path_build,
  path_public,
  path_ui
} from "../constants";

export const linkAsset = async (from: string, to: string) => {
  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to);
};

export const loadPublicAssetNamespaces: NamespaceLoader = async module => {
  const baseDir = join(
    module.packageLocation,
    module.root ? "" : path_build,
    path_ui,
    path_public
  );
  const publicAssets: string[] = [];

  if (existsSync(baseDir)) {
    publicAssets.push(...(await listFiles(baseDir)));
  }

  return [{ name: namespace_public, values: publicAssets }];
};

export const getPublicAssetToModuleMap = (context: IContext) => {
  const publicAssets = context.namespaceHandler.get(namespace_public);

  const publicAssetToModuleMap = Object.fromEntries(
    publicAssets.map(p => [p.value, p.module])
  );

  return publicAssetToModuleMap;
};
