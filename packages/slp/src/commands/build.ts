import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  buildServerlessTemplate,
  bundleFunctions,
  compileTypeScript,
  deleteBuildDir,
  doesServerlessFunctionsHaveDefaultExport,
  file_index_js,
  file_packageJson,
  file_templateJson,
  file_templateYaml,
  file_tsConfigBuildJson,
  generateIndex,
  installLayerDependencies,
  isValidTsConfigBuildJson,
  key_slp,
  path_build,
  path_functions,
  path_serverless,
  savePackageJson,
  updateSodaruModuleKeyInPackageJson,
  validateDependencyModules,
  validatePackageJson,
  validateServerlessTemplateWithSchema
} from "@somod/sdk-lib";
import { Command } from "commander";

export const BuildAction = async ({
  verbose
}: CommonOptions): Promise<void> => {
  const dir = process.cwd();

  await Promise.all([
    taskRunner(
      `Validate in ${file_packageJson}`,
      validatePackageJson,
      verbose,
      dir,
      key_slp
    ),
    taskRunner(
      `Check if ${file_tsConfigBuildJson} is valid`,
      isValidTsConfigBuildJson,
      verbose,
      dir,
      {},
      []
    ),
    taskRunner(
      `Validate module dependency`,
      validateDependencyModules,
      verbose,
      dir,
      [key_slp]
    ),
    taskRunner(
      `Check if ${path_serverless}/${path_functions} have default export`,
      doesServerlessFunctionsHaveDefaultExport,
      verbose,
      dir
    )
  ]);

  await taskRunner(
    `Delete ${path_build} directory`,
    deleteBuildDir,
    verbose,
    dir
  );
  await taskRunner(`Compile Typescript`, compileTypeScript, verbose, dir);

  await taskRunner(
    `validate ${path_serverless}/${file_templateYaml}`,
    validateServerlessTemplateWithSchema,
    verbose,
    dir
  );

  await taskRunner(
    `Generate ${path_build}/${path_serverless}/${file_templateJson}`,
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
    `Generate ${path_build}/${file_index_js}`,
    generateIndex,
    verbose,
    dir,
    []
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
