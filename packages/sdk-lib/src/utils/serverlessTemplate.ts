import { readJsonFileStore } from "@sodaru/cli-base";
import { mkdir, writeFile } from "fs/promises";
import { isPlainObject } from "lodash";
import { dirname, join, relative } from "path";
import {
  file_lambdaBundleExclude,
  file_packageJson,
  key_slpLambdaBundleExclude,
  path_build,
  path_functions,
  path_slpWorkingDir
} from "..";
import { getModuleGraph, ModuleNode, toChildFirstList } from "./module";
import { generateSamTemplate } from "./serverless";
import { SAMTemplate } from "./serverless/types";

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

const saveFunctionBundleExcludes = async (
  dir: string,
  rootModule: ModuleNode
): Promise<void> => {
  const excludes: Record<string, Record<string, string[]>> = {};

  const allModules = toChildFirstList(rootModule);
  await Promise.all(
    allModules.map(async module => {
      const packageJsonPath = join(module.packageLocation, file_packageJson);
      const packageJson = await readJsonFileStore(packageJsonPath);
      if (isPlainObject(packageJson[key_slpLambdaBundleExclude])) {
        excludes[module.name] = packageJson[
          key_slpLambdaBundleExclude
        ] as Record<string, string[]>;
      }
    })
  );

  await mkdir(join(dir, path_slpWorkingDir), { recursive: true });

  await writeFile(
    join(dir, path_slpWorkingDir, file_lambdaBundleExclude),
    JSON.stringify(excludes)
  );
};

export const generateSAMTemplate = async (
  dir: string,
  moduleIndicators: string[]
): Promise<SAMTemplate> => {
  const rootModuleNode = await getModuleGraph(dir, moduleIndicators);

  await saveFunctionBundleExcludes(dir, rootModuleNode);
  const samTemplate = await generateSamTemplate(dir, moduleIndicators);

  return samTemplate;
};
