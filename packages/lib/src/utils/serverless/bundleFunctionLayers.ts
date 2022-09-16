import { childProcess, ChildProcessStreamConfig } from "nodejs-cli-runner";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import {
  file_packageJson,
  path_functionLayers,
  path_serverless,
  path_somodWorkingDir
} from "../constants";
import { read } from "../packageJson";
import { getFunctionLayerLibraries } from "./keywords/functionLayer";
import { ModuleServerlessTemplate, ModuleServerlessTemplateMap } from "./types";

const path_layerNodeJs = "nodejs";

export const bundleFunctionLayersForModule = async (
  rootDir: string,
  serverlessTemplate: ModuleServerlessTemplate,
  verbose = false
): Promise<void> => {
  const layerLibraries = getFunctionLayerLibraries(serverlessTemplate.template);

  const devDependencies =
    (await read(serverlessTemplate.packageLocation)).devDependencies || {};

  const buildFunctionLayersPath = join(
    rootDir,
    path_somodWorkingDir,
    path_serverless,
    path_functionLayers,
    serverlessTemplate.module
  );

  const npmCommand = process.platform == "win32" ? "npm.cmd" : "npm";
  const streamConfig: ChildProcessStreamConfig = {
    show: verbose ? "on" : "error",
    return: "off"
  };

  await Promise.all(
    Object.keys(layerLibraries).map(async layerName => {
      try {
        const layerPackageJson = {
          name: serverlessTemplate.module + "-" + layerName.toLowerCase(),
          version: "1.0.0",
          description: `Lambda function layer - ${layerName}`,
          dependencies: Object.fromEntries(
            layerLibraries[layerName].map(library => [
              library,
              devDependencies[library]
            ])
          )
        };

        const layerLocation = join(
          buildFunctionLayersPath,
          layerName,
          path_layerNodeJs
        );

        await mkdir(layerLocation, { recursive: true });
        await writeFile(
          join(layerLocation, file_packageJson),
          JSON.stringify(layerPackageJson, null, 2)
        );

        await childProcess(
          layerLocation,
          npmCommand,
          ["install"],
          streamConfig,
          streamConfig
        );
      } catch (e) {
        throw new Error(
          `bundle function layer failed for ${layerName} from ${serverlessTemplate.module} module: ${e.message}`
        );
      }
    })
  );
};

export const bundleFunctionLayers = async (
  dir: string,
  moduleTemplateMap: ModuleServerlessTemplateMap,
  verbose = false
): Promise<void> => {
  await Promise.all(
    Object.keys(moduleTemplateMap).map(async moduleName => {
      await bundleFunctionLayersForModule(
        dir,
        moduleTemplateMap[moduleName],
        verbose
      );
    })
  );
};
