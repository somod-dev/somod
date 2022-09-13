import { join } from "path";
import {
  file_index_js,
  path_build,
  path_functions,
  path_serverless
} from "../constants";
import { build as esbuild } from "esbuild";
import { getNodeRuntimeVersion } from "./utils";
import { ModuleServerlessTemplate } from "./types";
import { getDeclaredFunctions } from "./keywords/function";
import { listLibraries } from "@somod/lambda-base-layer";
import { get as getExports } from "../exports";

export const bundleFunctions = async (
  dir: string,
  rootServerlessTemplate: ModuleServerlessTemplate,
  verbose = false
): Promise<void> => {
  const declaredFunctions = getDeclaredFunctions(
    rootServerlessTemplate.template
  );
  const commonExcludes = ["aws-sdk"];
  const baseLayerLibraries = await listLibraries();
  commonExcludes.push(...baseLayerLibraries);

  const srcFunctionsPath = join(dir, path_serverless, path_functions);
  const buildFunctionsPath = join(
    dir,
    path_build,
    path_serverless,
    path_functions
  );

  await Promise.all(
    declaredFunctions.map(async _function => {
      const functionName = _function.name;
      const functionFileName = functionName + ".ts";

      const functionFilePath = join(srcFunctionsPath, functionFileName);
      const exports = getExports(functionFilePath);
      if (!exports.default) {
        throw new Error(`${functionFilePath} must have a default export`);
      }

      try {
        await esbuild({
          entryPoints: [functionFilePath],
          bundle: true,
          outfile: join(buildFunctionsPath, functionName, file_index_js),
          sourcemap: false,
          platform: "node",
          external: [...commonExcludes, ..._function.exclude],
          minify: true,
          target: ["node" + getNodeRuntimeVersion()],
          logLevel: verbose ? "verbose" : "silent"
        });
      } catch (e) {
        throw new Error(
          `bundle function failed for ${functionFileName}: ${e.message}`
        );
      }
    })
  );
};
