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
import { ModuleHandler } from "../moduleHandler";
import { ServerlessTemplateHandler } from "./serverlessTemplate/serverlessTemplate";
import { ServerlessTemplate } from "somod-types";

const path_layerNodeJs = "nodejs";

export const bundleFunctionLayersForModule = async (
  rootDir: string,
  moduleName: string,
  modulePackageLocation: string,
  serverlessTemplate: ServerlessTemplate,
  verbose = false
): Promise<void> => {
  const layerLibraries = getFunctionLayerLibraries(serverlessTemplate);

  const devDependencies =
    (await read(modulePackageLocation)).devDependencies || {};

  const buildFunctionLayersPath = join(
    rootDir,
    path_somodWorkingDir,
    path_serverless,
    path_functionLayers,
    moduleName
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
          name: moduleName + "-" + layerName.toLowerCase(),
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
          `bundle function layer failed for ${layerName} from ${moduleName} module: ${e.message}`
        );
      }
    })
  );
};

export const bundleFunctionLayers = async (
  dir: string,
  verbose = false
): Promise<void> => {
  const moduleNodes = await ModuleHandler.getModuleHandler().listModules();
  const templates =
    await ServerlessTemplateHandler.getServerlessTemplateHandler().listTemplates();
  const templateMap = Object.fromEntries(
    templates.map(t => [t.module, t.template])
  );
  await Promise.all(
    moduleNodes.map(async moduleNode => {
      const moduleName = moduleNode.module.name;
      if (templateMap[moduleName]) {
        await bundleFunctionLayersForModule(
          dir,
          moduleName,
          moduleNode.module.packageLocation,
          templateMap[moduleName],
          verbose
        );
      }
    })
  );
};
