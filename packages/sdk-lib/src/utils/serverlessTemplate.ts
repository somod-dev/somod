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
  path_lambda_layers,
  path_slpWorkingDir
} from "..";
import { getToBeBundledLibraries } from "./library";
import { getModuleGraph, ModuleNode, toChildFirstList } from "./module";
import { generateSamTemplate } from "./serverless";
import { SAMTemplate } from "./serverless/types";
import {
  getSAMResourceLogicalId,
  getSAMResourceName
} from "./serverless/utils";

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

const prepareFunctionLayer = async (
  dir: string,
  module: string,
  name: string,
  dependencies: Record<string, string>
): Promise<void> => {
  const layerPackageJson = {
    name: module + "-" + name.toLowerCase(),
    version: "1.0.0",
    description: `Lambda function layer - ${name}`,
    dependencies
  };

  const layerPackageJsonPath = join(
    dir,
    path_slpWorkingDir,
    path_lambda_layers,
    module,
    name,
    file_packageJson
  );

  const destDir = dirname(layerPackageJsonPath);
  await mkdir(destDir, { recursive: true });
  await writeFile(
    layerPackageJsonPath,
    JSON.stringify(layerPackageJson, null, 2)
  );
};

const baseLayerName = "baseLayer";
const baseModuleName = "@somod/slp";

const getBaseLambdaLayer = async (
  dir: string
): Promise<SAMTemplate["Resources"][string]> => {
  const toBeBundledLibraries = await getToBeBundledLibraries(dir, "slp");
  const module = baseModuleName;
  const layerName = baseLayerName;
  const defaultLayer: SAMTemplate["Resources"][string] & {
    Metadata: Record<string, unknown>;
  } = {
    Type: "AWS::Serverless::LayerVersion",
    Metadata: {
      BuildMethod: "nodejs14.x",
      BuildArchitecture: "arm64"
    },
    Properties: {
      LayerName: getSAMResourceName(module, layerName),
      Description:
        "Set of npm libraries to be requiired in all Lambda funtions",
      CompatibleArchitectures: ["arm64"],
      CompatibleRuntimes: ["nodejs14.x"],
      RetentionPolicy: "Delete",
      ContentUri: `${path_slpWorkingDir}/${path_lambda_layers}/${module}/${layerName}`
    }
  };

  await prepareFunctionLayer(dir, module, layerName, toBeBundledLibraries);

  return defaultLayer;
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

  const baseLambdaLayer = await getBaseLambdaLayer(dir);
  const baseLayerId = getSAMResourceLogicalId(baseModuleName, baseLayerName);
  samTemplate.Resources = {
    [baseLayerId]: baseLambdaLayer,
    ...samTemplate.Resources
  };

  Object.keys(samTemplate.Resources).forEach(resourceId => {
    if (samTemplate.Resources[resourceId].Type == "AWS::Serverless::Function") {
      const layers = (samTemplate.Resources[resourceId].Properties.Layers ||
        []) as { Ref: string }[];
      layers.unshift({ Ref: baseLayerId });
      samTemplate.Resources[resourceId].Properties.Layers = layers;
    }
  });

  return samTemplate;
};
