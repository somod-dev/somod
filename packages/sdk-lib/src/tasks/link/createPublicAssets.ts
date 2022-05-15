import { copyFile, mkdir } from "fs/promises";
import { dirname, join } from "path";
import {
  file_packageJson,
  path_build,
  path_public,
  path_ui
} from "../../utils/constants";
import { readJsonFileStore, ErrorSet } from "@solib/cli-base";
import { resolve } from "../../utils/module";
import { getModuleInfo } from "../../utils/moduleInfo";
import { getPublicAssetToModulesMap } from "../../utils/publicAssets";

export const createPublicAssets = async (
  dir: string,
  moduleIndicators: string[],
  validateOnly = false
): Promise<void> => {
  const modules = await getModuleInfo(dir, moduleIndicators);
  const publicAssetToModulesMap = await getPublicAssetToModulesMap(modules);

  const dependencyMap: Record<string, string[]> = {};
  modules.forEach(module => {
    dependencyMap[module.name] = module.dependencies;
  });

  const errors: Error[] = [];

  const publicAssetToModuleNameMap: Record<string, string> = {};

  Object.keys(publicAssetToModulesMap).forEach(publicAsset => {
    if (publicAssetToModulesMap[publicAsset].length == 1) {
      publicAssetToModuleNameMap[publicAsset] =
        publicAssetToModulesMap[publicAsset][0].moduleName;
    } else {
      const moduleNamesToResolve = publicAssetToModulesMap[publicAsset].map(
        m => m.moduleName
      );
      try {
        publicAssetToModuleNameMap[publicAsset] = resolve(
          moduleNamesToResolve,
          dependencyMap
        );
      } catch (e) {
        errors.push(
          new Error(
            `Error while resolving (${moduleNamesToResolve.join(
              ", "
            )}) modules for the public asset '${publicAsset}': ${e.message}`
          )
        );
      }
    }
  });

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }

  if (!validateOnly) {
    // create public assets in root dir
    const rootModuleName = (
      await readJsonFileStore(join(dir, file_packageJson))
    ).name as string;

    const createPagePromises = Object.keys(publicAssetToModuleNameMap).map(
      async publicAsset => {
        const moduleName = publicAssetToModuleNameMap[publicAsset];
        if (moduleName != rootModuleName) {
          const { packageLocation } = publicAssetToModulesMap[
            publicAsset
          ].filter(pageModule => pageModule.moduleName == moduleName)[0];

          const publicAssetPath = join(dir, path_public, publicAsset);
          const publicAssetDir = dirname(publicAssetPath);
          await mkdir(publicAssetDir, { recursive: true });
          await copyFile(
            join(
              packageLocation,
              path_build,
              path_ui,
              path_public,
              publicAsset
            ),
            publicAssetPath
          );
        }
      }
    );

    await Promise.all(createPagePromises);
  }
};
