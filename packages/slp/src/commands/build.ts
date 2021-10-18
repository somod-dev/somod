import { CommonOptions, taskRunner } from "@sodaru-cli/base";
import {
  buildFunctionLayers,
  buildServerlessTemplate,
  bundleRootServerlessFunctions,
  compileTypeScript,
  deleteBuildDir,
  doesAwsSdkIsRightVersionInPackageJson,
  doesFilesHasBuildInPackageJson,
  doesJsnextMainNotSetInPackageJson,
  doesModuleIsBuildIndexInPackageJson,
  doesServerlessFunctionsHaveDefaultExport,
  doesSideEffectsIsFalseInPackageJson,
  doesSlpIsTrueInPackageJson,
  doesTypeIsNotSetInPackageJson,
  doesTypingsIsBuildIndexInPackageJson,
  file_functionIndex_js,
  file_index_dts,
  file_index_js,
  file_packageJson,
  file_templateJson,
  file_templateYaml,
  file_tsConfigBuildJson,
  generateFunctionIndex,
  generateIndex,
  isValidTsConfigBuildJson,
  key_files,
  key_jsnextMain,
  key_module,
  key_moduleAwsSdk,
  key_sideEffects,
  key_slp,
  key_type,
  key_typings,
  path_build,
  path_functions,
  path_serverless,
  validateModuleDependency,
  validateServerlessTemplateWithSchema
} from "@sodaru-cli/package-manager-lib";
import { Command } from "commander";

export const BuildAction = async ({
  verbose
}: CommonOptions): Promise<void> => {
  const dir = process.cwd();

  await Promise.all([
    taskRunner(
      `Check if ${key_slp} is true in ${file_packageJson}`,
      doesSlpIsTrueInPackageJson,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${key_module} is '${path_build}/${file_index_js}' in ${file_packageJson}`,
      doesModuleIsBuildIndexInPackageJson,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${key_typings} is '${path_build}/${file_index_dts}' in ${file_packageJson}`,
      doesTypingsIsBuildIndexInPackageJson,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${key_sideEffects} is false in ${file_packageJson}`,
      doesSideEffectsIsFalseInPackageJson,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${key_type} is not set in ${file_packageJson}`,
      doesTypeIsNotSetInPackageJson,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${key_jsnextMain} is not set in ${file_packageJson}`,
      doesJsnextMainNotSetInPackageJson,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${key_files} include ${path_build} in ${file_packageJson}`,
      doesFilesHasBuildInPackageJson,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${file_tsConfigBuildJson} is valid`,
      isValidTsConfigBuildJson,
      verbose,
      dir,
      {},
      [path_serverless]
    ),
    taskRunner(
      `Validate module dependency`,
      validateModuleDependency,
      verbose,
      dir,
      [key_slp]
    ),
    taskRunner(
      `Check if ${path_serverless}/${path_functions} have default export`,
      doesServerlessFunctionsHaveDefaultExport,
      verbose,
      dir
    ),
    taskRunner(
      `Check if ${key_moduleAwsSdk} has right version in ${file_packageJson}`,
      doesAwsSdkIsRightVersionInPackageJson,
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
    `Bundle root module functions`,
    bundleRootServerlessFunctions,
    verbose,
    dir
  );
  await taskRunner(`Copy Layers to build`, buildFunctionLayers, verbose, dir);
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
    `Generate ${path_build}/${path_serverless}/${file_functionIndex_js}`,
    generateFunctionIndex,
    verbose,
    dir
  );
  await taskRunner(
    `Generate ${path_build}/${file_index_js}`,
    generateIndex,
    verbose,
    dir,
    [
      `${path_serverless}/${file_functionIndex_js.substring(
        0,
        file_functionIndex_js.lastIndexOf(".js")
      )}`
    ]
  );
};

const buildCommand = new Command("build");

buildCommand.action(BuildAction);

export default buildCommand;
