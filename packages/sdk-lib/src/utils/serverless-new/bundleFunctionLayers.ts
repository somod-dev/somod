import { childProcess, ChildProcessStreamConfig } from "@solib/cli-base";
import { mkdir, writeFile } from "fs/promises";
import { difference } from "lodash";
import { join } from "path";
import {
  file_packageJson,
  path_build,
  path_functionLayers,
  path_serverless
} from "../constants";
import { read } from "../packageJson";
import { getFunctionLayerLibraries } from "./keywords/functionLayer";
import { ModuleServerlessTemplate } from "./types";

const path_layerNodeJs = "nodejs";

export const bundle = async (
  dir: string,
  rootServerlessTemplate: ModuleServerlessTemplate,
  verbose = false
): Promise<void> => {
  const layerLibraries = getFunctionLayerLibraries(
    rootServerlessTemplate.template
  );

  const devDependencies = (await read(dir)).devDependencies || {};

  const devDependenciesList = Object.keys(devDependencies);

  const missingLibraries: string[] = [];

  Object.keys(layerLibraries).forEach(layerName => {
    const _missing = difference(layerLibraries[layerName], devDependenciesList);
    missingLibraries.push(
      ..._missing.map(libraryName => `${libraryName} - (${layerName})`)
    );
  });

  if (missingLibraries.length > 0) {
    throw new Error(
      `Following layer libraries are missing as dev dependencies\n${missingLibraries.join(
        "\n"
      )}`
    );
  }

  const buildFunctionLayersPath = join(
    dir,
    path_build,
    path_serverless,
    path_functionLayers
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
          name: rootServerlessTemplate.module + "-" + layerName.toLowerCase(),
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
          `bundle function layer failed for ${layerName}: ${e.message}`
        );
      }
    })
  );
};
