import { readJsonFileStore } from "@sodaru/cli-base";
import { existsSync } from "fs";
import { readdir } from "fs/promises";
import { join, normalize } from "path";
import {
  path_functions,
  path_build,
  path_serverless,
  file_packageJson
} from "../../utils/constants";
import { prepareFunctionToBundle } from "../../utils/serverlessTemplate";
import { bundleFunctions } from "./bundleFunctions";

export const bundleRootFunctions = async (
  dir: string,
  sourceMap = false
): Promise<void> => {
  const functionsDir = normalize(
    join(dir, path_build, path_serverless, path_functions)
  );

  const rootPackageJson = await readJsonFileStore(join(dir, file_packageJson));

  const rootModuleName = rootPackageJson.name as string;

  if (existsSync(functionsDir)) {
    const functions = await readdir(functionsDir);
    await Promise.all(
      functions.map(async _function => {
        const functionName = _function.substring(
          0,
          _function.lastIndexOf(".js")
        );
        await prepareFunctionToBundle(
          dir,
          rootModuleName,
          rootModuleName,
          functionName
        );
      })
    );

    await bundleFunctions(dir, sourceMap);
  }
};
