import { childProcess, ChildProcessStreamConfig } from "nodejs-cli-runner";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import {
  file_packageJson,
  path_functionLayers,
  path_serverless,
  path_somodWorkingDir
} from "../constants";
import { getDeclaredFunctionLayers } from "./keywords/functionLayer";
import { ModuleHandler } from "../moduleHandler";
import { ServerlessTemplateHandler } from "./serverlessTemplate/serverlessTemplate";
import { IModuleHandler, IServerlessTemplateHandler } from "somod-types";
import { read } from "../packageJson";

const path_layerNodeJs = "nodejs";

export const bundleFunctionLayersForModule = async (
  rootDir: string,
  moduleName: string,
  serverlessTemplateHandler: IServerlessTemplateHandler,
  moduleHandler: IModuleHandler,
  verbose = false
): Promise<void> => {
  const declaredLayers = await getDeclaredFunctionLayers(
    serverlessTemplateHandler,
    moduleName
  );

  const moduleDevDependenciesMap: Record<string, Record<string, string>> = {};
  declaredLayers.forEach(declaredLayer => {
    declaredLayer.libraries.forEach(library => {
      moduleDevDependenciesMap[library.module] = {};
    });
  });
  await Promise.all(
    Object.keys(moduleDevDependenciesMap).map(async module => {
      const modulePackageLocation = (await moduleHandler.getModule(module))
        .module.packageLocation;

      const devDependencies = ((await read(modulePackageLocation))
        .devDependencies || {}) as Record<string, string>;
      moduleDevDependenciesMap[module] = devDependencies;
    })
  );

  const buildFunctionLayersPath = join(
    rootDir,
    path_somodWorkingDir,
    path_serverless,
    path_functionLayers
  );

  const npmCommand = process.platform == "win32" ? "npm.cmd" : "npm";
  const streamConfig: ChildProcessStreamConfig = {
    show: verbose ? "on" : "error",
    return: "off"
  };

  await Promise.all(
    Object.values(declaredLayers).map(async declaredLayer => {
      try {
        const layerPackageJson = {
          name: declaredLayer.module + "-" + declaredLayer.name.toLowerCase(),
          version: "1.0.0",
          description: `Lambda function layer - ${declaredLayer.name}`,
          dependencies: Object.fromEntries(
            declaredLayer.libraries.map(library => [
              library.name,
              moduleDevDependenciesMap[library.module][library.name]
            ])
          )
        };

        const layerLocation = join(
          buildFunctionLayersPath,
          declaredLayer.module,
          declaredLayer.name,
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

        await Promise.all(
          Object.keys(declaredLayer.content).map(async contentPath => {
            const contentFullPath = join(
              buildFunctionLayersPath,
              declaredLayer.module,
              declaredLayer.name,
              contentPath
            );

            await mkdir(dirname(contentFullPath), { recursive: true });
            await writeFile(
              contentFullPath,
              declaredLayer.content[contentPath]
            );
          })
        );
      } catch (e) {
        throw new Error(
          `bundle function layer failed for ${declaredLayer} from ${moduleName} module: ${e.message}`
        );
      }
    })
  );
};

export const bundleFunctionLayers = async (
  dir: string,
  verbose = false
): Promise<void> => {
  const moduleHandler = ModuleHandler.getModuleHandler();
  const moduleNodes = await moduleHandler.listModules();
  const serverlessTemplateHandler =
    ServerlessTemplateHandler.getServerlessTemplateHandler();
  const templates = await serverlessTemplateHandler.listTemplates();
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
          serverlessTemplateHandler,
          moduleHandler,
          verbose
        );
      }
    })
  );
};
