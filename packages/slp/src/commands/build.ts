import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  buildParameters,
  buildServerlessTemplate,
  bundleFunctions,
  compileTypeScript,
  deleteBuildDir,
  doesServerlessFunctionsHaveDefaultExport,
  file_packageJson,
  file_parametersYaml,
  file_templateYaml,
  file_tsConfigBuildJson,
  findRootDir,
  installLayerDependencies,
  isValidTsConfigBuildJson,
  key_slp,
  loadAndResolveNamespaces,
  path_build,
  path_functions,
  path_serverless,
  savePackageJson,
  updateSodaruModuleKeyInPackageJson,
  validatePackageJson,
  validateParametersWithSchema,
  validateServerlessTemplateWithSchema
} from "@somod/sdk-lib";
import { Command } from "commander";

export const BuildAction = async ({
  verbose
}: CommonOptions): Promise<void> => {
  const dir = findRootDir();

  await Promise.all([
    taskRunner(
      `Validate ${file_packageJson}`,
      validatePackageJson,
      verbose,
      dir,
      key_slp
    ),
    taskRunner(
      `Validate ${file_tsConfigBuildJson}`,
      isValidTsConfigBuildJson,
      verbose,
      dir,
      {},
      []
    ),
    taskRunner(
      `Validate ${path_serverless}/${file_templateYaml} with schema`,
      validateServerlessTemplateWithSchema,
      verbose,
      dir
    ),
    taskRunner(
      `Validate ${file_parametersYaml} with schema`,
      validateParametersWithSchema,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${path_serverless}/${path_functions} have default export`,
      doesServerlessFunctionsHaveDefaultExport,
      verbose,
      dir
    )
  ]);

  await taskRunner(
    `Resolve Namespaces`,
    loadAndResolveNamespaces,
    verbose,
    dir,
    [key_slp]
  );

  await taskRunner(
    `Delete ${path_build} directory`,
    deleteBuildDir,
    verbose,
    dir
  );
  await taskRunner(`Compile Typescript`, compileTypeScript, verbose, dir);

  await taskRunner(
    `Build ${path_serverless}/${file_templateYaml}`,
    buildServerlessTemplate,
    verbose,
    dir,
    [key_slp]
  );

  await taskRunner(
    `Bundle Serverless Functions`,
    bundleFunctions,
    verbose,
    dir
  );

  await taskRunner(
    `Install libraries of Serverless FunctionLayers`,
    installLayerDependencies,
    verbose,
    dir,
    verbose
  );

  await taskRunner(
    `Build ${file_parametersYaml}`,
    buildParameters,
    verbose,
    dir,
    [key_slp]
  );

  await taskRunner(
    `Set ${key_slp} in ${file_packageJson}`,
    updateSodaruModuleKeyInPackageJson,
    verbose,
    dir,
    key_slp
  );
  await taskRunner(`Save ${file_packageJson}`, savePackageJson, verbose, dir);
};

const buildCommand = new Command("build");

buildCommand.action(BuildAction);

export default buildCommand;
