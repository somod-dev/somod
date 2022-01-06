import { mkdir, writeFile } from "fs/promises";
import { dirname, join, relative } from "path";
import {
  path_build,
  path_functions,
  path_slpWorkingDir
} from "../utils/constants";

export const prepareFunctionToBundle = async (
  dir: string,
  module: string,
  rootModuleName: string,
  functionName: string
): Promise<void> => {
  const functionPath = join(
    dir,
    path_slpWorkingDir,
    path_functions,
    module,
    functionName + ".js"
  );

  let exportFrom = module;
  if (module == rootModuleName) {
    const rootModuleEntryPoint = join(dir, path_build);
    exportFrom = relative(dirname(functionPath), rootModuleEntryPoint)
      .split("\\")
      .join("/");
  }

  const functionCode = `export { ${functionName} as default } from "${exportFrom}";`;
  const functionDir = dirname(functionPath);
  await mkdir(functionDir, { recursive: true });
  await writeFile(functionPath, functionCode);
};
