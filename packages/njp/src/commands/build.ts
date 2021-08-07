import {
  buildUiPublic,
  CommonOptions,
  compileTypeScript,
  deleteBuildDir,
  doesJsnextMainNotSetInPackageJson,
  doesModuleIsBuildIndexInPackageJson,
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
  key_njp,
  key_sideEffects,
  key_type,
  path_build,
  path_public,
  path_ui,
  taskRunner
} from "@sodaru/package-manager-lib";
import { Command } from "commander";

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
      `Check if ${file_tsConfigBuildJson} is valid`,
      isValidTsConfigBuildJson,
      verbose,
      dir,
      { jsx: "react" },
      ["ui"]
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
    dir
  );
};

const buildCommand = new Command("build");

buildCommand.action(BuildAction);

export default buildCommand;
