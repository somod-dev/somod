import {
  buildUiPublic,
  compileTypeScript,
  deleteBuildDir,
  doesJsnextMainNotSetInPackageJson,
  doesModuleIsBuildIndexInPackageJson,
  doesTypingsIsBuildIndexInPackageJson,
  doesNjpIsTrueInPackageJson,
  doesSideEffectsIsFalseInPackageJson,
  doesTypeIsNotSetInPackageJson,
  file_index_js,
  file_packageJson,
  file_pageIndex_js,
  file_tsConfigBuildJson,
  generateIndex,
  generatePageIndex,
  isValidTsConfigBuildJson,
  key_jsnextMain,
  key_module,
  key_typings,
  key_njp,
  key_sideEffects,
  key_type,
  path_build,
  path_public,
  path_ui,
  file_index_dts,
  doesFilesHasBuildInPackageJson,
  key_files,
  validateModuleDependency
} from "@somod/sdk-lib";
import { Command } from "commander";
import { CommonOptions, taskRunner } from "@sodaru/cli-base";

export const BuildAction = async ({
  verbose
}: CommonOptions): Promise<void> => {
  const dir = process.cwd();

  await Promise.all([
    taskRunner(
      `Check if ${key_njp} is true in ${file_packageJson}`,
      doesNjpIsTrueInPackageJson,
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
      { jsx: "react" },
      [path_ui]
    ),
    taskRunner(
      `Validate module dependency`,
      validateModuleDependency,
      verbose,
      dir,
      [key_njp]
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
    `Build ${path_build}/${path_ui}/${path_public}`,
    buildUiPublic,
    verbose,
    dir
  );
  await taskRunner(
    `Generate ${path_build}/${path_ui}/${file_pageIndex_js}`,
    generatePageIndex,
    verbose,
    dir
  );
  await taskRunner(
    `Generate ${path_build}/${file_index_js}`,
    generateIndex,
    verbose,
    dir,
    [
      `${path_ui}/${file_pageIndex_js.substring(
        0,
        file_pageIndex_js.lastIndexOf(".js")
      )}`
    ]
  );
};

const buildCommand = new Command("build");

buildCommand.action(BuildAction);

export default buildCommand;
