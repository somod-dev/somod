import { existsSync } from "fs";
import { readdir } from "fs/promises";
import { basename, extname, join } from "path";
import {
  file_index_js,
  path_build,
  path_functions,
  path_serverless
} from "../constants";
import { build as esbuild } from "esbuild";
import { getNodeRuntimeVersion } from "../serverless/utils";
import { ModuleServerlessTemplate } from "./types";
import { getFunctionExcludes } from "./keywords/function";
import { listLayerLibraries } from "../serverless/baseModule/layers/baseLayer";

export const bundle = async (
  dir: string,
  rootServerlessTemplate: ModuleServerlessTemplate
): Promise<void> => {
  const functionExcludes = getFunctionExcludes(rootServerlessTemplate.template);
  const commonExcludes = ["aws-sdk"];
  const baseLayerLibraries = await listLayerLibraries();
  commonExcludes.push(...baseLayerLibraries);

  const srcFunctionsPath = join(dir, path_serverless, path_functions);
  const buildFunctionsPath = join(
    dir,
    path_build,
    path_serverless,
    path_functions
  );
  if (existsSync(srcFunctionsPath)) {
    const functions = await readdir(srcFunctionsPath);
    await Promise.all(
      functions.map(async functionFileName => {
        const functionName = basename(
          functionFileName,
          extname(functionFileName)
        );

        try {
          await esbuild({
            entryPoints: [join(srcFunctionsPath, functionFileName)],
            bundle: true,
            outfile: join(buildFunctionsPath, functionName, file_index_js),
            sourcemap: false,
            platform: "node",
            external: [...commonExcludes, ...functionExcludes[functionName]],
            minify: true,
            target: ["node" + getNodeRuntimeVersion()]
          });
        } catch (e) {
          throw new Error(
            `bundle function failed for ${functionFileName}: ${e.message}`
          );
        }
      })
    );
  }
};
