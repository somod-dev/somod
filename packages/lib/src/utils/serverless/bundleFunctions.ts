import { build as esbuild } from "esbuild";
import { join } from "path";
import {
  file_index_js,
  path_build,
  path_functions,
  path_serverless,
  path_somodWorkingDir
} from "../constants";
import { getDeclaredFunctionsWithExcludedLibraries } from "./keywords/function";
import { ModuleServerlessTemplateMap } from "./types";
import { getNodeRuntimeVersion } from "./utils";

export const bundleFunctionsOfModule = async (
  dir: string,
  moduleName: string,
  moduleTemplateMap: ModuleServerlessTemplateMap,
  verbose = false,
  sourcemap = false
): Promise<void> => {
  const module = moduleTemplateMap[moduleName];

  const declaredFunctionsWithExcludes =
    getDeclaredFunctionsWithExcludedLibraries(moduleName, moduleTemplateMap);

  const compiledFunctionsPath = join(
    module.packageLocation,
    path_build,
    path_serverless,
    path_functions
  );
  const bundledFunctionsPath = join(
    dir,
    path_somodWorkingDir,
    path_serverless,
    path_functions,
    module.module
  );

  await Promise.all(
    declaredFunctionsWithExcludes.map(async _function => {
      const functionName = _function.name;
      const functionFileName = functionName + ".js";

      const functionFilePath = join(compiledFunctionsPath, functionFileName);

      try {
        await esbuild({
          entryPoints: [functionFilePath],
          bundle: true,
          outfile: join(bundledFunctionsPath, functionName, file_index_js),
          sourcemap: sourcemap ? "inline" : false,
          platform: "node",
          external: _function.exclude,
          minify: true,
          target: ["node" + getNodeRuntimeVersion()],
          logLevel: verbose ? "verbose" : "silent"
        });
      } catch (e) {
        throw new Error(
          `bundle function failed for ${functionFileName} from ${module.module} module: ${e.message}`
        );
      }
    })
  );
};

export const bundleFunctions = async (
  dir: string,
  moduleTemplateMap: ModuleServerlessTemplateMap,
  verbose = false,
  sourcemap = false
) => {
  await Promise.all(
    Object.keys(moduleTemplateMap).map(async moduleName => {
      await bundleFunctionsOfModule(
        dir,
        moduleName,
        moduleTemplateMap,
        verbose,
        sourcemap
      );
    })
  );
};
