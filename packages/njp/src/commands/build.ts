import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  buildUiPublic,
  compileTypeScript,
  deleteBuildDir,
  file_index_js,
  file_packageJson,
  file_pageIndex_js,
  file_tsConfigBuildJson,
  generateIndex,
  generatePageIndex,
  isValidTsConfigBuildJson,
  key_njp,
  path_build,
  path_public,
  path_ui,
  savePackageJson,
  updateSodaruModuleKeyInPackageJson,
  validateDependencyModules,
  validatePackageJson
} from "@somod/sdk-lib";
import { Command } from "commander";

export const BuildAction = async ({
  verbose
}: CommonOptions): Promise<void> => {
  const dir = process.cwd();

  await Promise.all([
    taskRunner(
      `validate ${file_packageJson}`,
      validatePackageJson,
      verbose,
      dir,
      key_njp
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
      validateDependencyModules,
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
  await taskRunner(
    `Set ${key_njp} in ${file_packageJson}`,
    updateSodaruModuleKeyInPackageJson,
    verbose,
    dir,
    key_njp
  );
  await taskRunner(`Save ${file_packageJson}`, savePackageJson, verbose, dir);
};

const buildCommand = new Command("build");

buildCommand.action(BuildAction);

export default buildCommand;
