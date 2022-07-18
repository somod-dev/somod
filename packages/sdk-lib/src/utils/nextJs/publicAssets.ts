import { existsSync } from "fs";
import { readdir, stat, mkdir, copyFile } from "fs/promises";
import { dirname, join } from "path";
import {
  namespace_public,
  path_build,
  path_public,
  path_ui
} from "../constants";
import { Module, ModuleHandler } from "../moduleHandler";

export const linkAsset = async (from: string, to: string) => {
  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to);
};

export const loadPublicAssetNamespaces = async (module: Module) => {
  if (!module.namespaces[namespace_public]) {
    const baseDir = join(
      module.packageLocation,
      module.root ? "" : path_build,
      path_ui,
      path_public
    );
    const publicAssets: string[] = [];

    if (existsSync(baseDir)) {
      const queue: string[] = [""];

      while (queue.length > 0) {
        const dirToParse = queue.shift();
        const children = await readdir(join(baseDir, dirToParse));
        await Promise.all(
          children.map(async child => {
            const stats = await stat(join(baseDir, dirToParse, child));
            if (stats.isDirectory()) {
              queue.push(dirToParse + "/" + child);
            } else {
              publicAssets.push(dirToParse + "/" + child);
            }
          })
        );
      }
    }
    module.namespaces[namespace_public] = publicAssets.map(pa =>
      pa.startsWith("/") ? pa.substring(1) : pa
    );
  }
};

export const listAllPublicAssets = async (dir: string) => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir);

  const publicAssetToModuleMap = (
    await moduleHandler.getNamespaces(loadPublicAssetNamespaces)
  )[namespace_public];

  return publicAssetToModuleMap;
};
