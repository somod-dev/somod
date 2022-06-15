import { existsSync } from "fs";
import { copyFile, mkdir, readdir, stat } from "fs/promises";
import { dirname, join } from "path";
import {
  namespace_public,
  path_build,
  path_public,
  path_ui
} from "../constants";
import { Module } from "../moduleHandler";

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

export const loadPublicAssetNamespaces = async (module: Module) => {
  if (!module.namespaces[namespace_public]) {
    const baseDir = join(
      module.packageLocation,
      path_build,
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
