import { build as esbuild } from "esbuild";
import { join } from "path";
import { ServerlessTemplate } from "somod-types";
import {
  file_index_js,
  path_build,
  path_functions,
  path_serverless,
  path_somodWorkingDir
} from "../constants";
import { ModuleHandler } from "../moduleHandler";
import { getDeclaredFunctionsWithExcludedLibraries } from "./keywords/function";
import { ServerlessTemplateHandler } from "./serverlessTemplate/serverlessTemplate";

export const bundleFunctionsOfModule = async (
  dir: string,
  moduleName: string,
  modulePackageLocation: string,
  moduleTemplateMap: Record<string, ServerlessTemplate>,
  verbose = false,
  sourcemap = false
): Promise<void> => {
  const declaredFunctionsWithExcludes =
    getDeclaredFunctionsWithExcludedLibraries(moduleName, moduleTemplateMap);

  const compiledFunctionsPath = join(
    modulePackageLocation,
    path_build,
    path_serverless,
    path_functions
  );
  const bundledFunctionsPath = join(
    dir,
    path_somodWorkingDir,
    path_serverless,
    path_functions,
    moduleName
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
          target: [
            "node" +
              ServerlessTemplateHandler.getServerlessTemplateHandler().getNodeRuntimeVersion()
          ],
          logLevel: verbose ? "verbose" : "silent"
        });
      } catch (e) {
        throw new Error(
          `bundle function failed for ${functionFileName} from ${moduleName} module: ${e.message}`
        );
      }
    })
  );
};

export const bundleFunctions = async (
  dir: string,
  verbose = false,
  sourcemap = false
) => {
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
        await bundleFunctionsOfModule(
          dir,
          moduleName,
          moduleNode.module.packageLocation,
          templateMap,
          verbose,
          sourcemap
        );
      }
    })
  );
};
