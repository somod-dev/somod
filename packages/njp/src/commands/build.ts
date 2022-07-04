import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  buildParameters,
  buildUiConfigYaml,
  buildUiPublic,
  compileTypeScript,
  deleteBuildDir,
  doesPagesHaveDefaultExport,
  file_configYaml,
  file_packageJson,
  file_parametersYaml,
  file_tsConfigBuildJson,
  findRootDir,
  isValidTsConfigBuildJson,
  key_njp,
  loadAndResolveNamespaces,
  path_build,
  path_pages,
  path_public,
  path_ui,
  savePackageJson,
  updateSodaruModuleKeyInPackageJson,
  validatePackageJson,
  validateParametersWithSchema,
  validateUiConfigYaml
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
      key_njp
    ),
    taskRunner(
      `Validate ${file_tsConfigBuildJson}`,
      isValidTsConfigBuildJson,
      verbose,
      dir,
      { jsx: "react" },
      [path_ui]
    ),
    taskRunner(
      `Validate ${path_ui}/${file_configYaml} with schema`,
      validateUiConfigYaml,
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
      `Check if ${path_ui}/${path_pages} have default export`,
      doesPagesHaveDefaultExport,
      verbose,
      dir
    )
  ]);

  await taskRunner(
    `Resolve Namespaces`,
    loadAndResolveNamespaces,
    verbose,
    dir,
    [key_njp]
  );

  await taskRunner(
    `Delete ${path_build} directory`,
    deleteBuildDir,
    verbose,
    dir
  );
  await taskRunner(`Compile Typescript`, compileTypeScript, verbose, dir);
  await taskRunner(
    `Build ${path_ui}/${path_public}`,
    buildUiPublic,
    verbose,
    dir
  );

  await taskRunner(
    `Build ${path_ui}/${file_configYaml}`,
    buildUiConfigYaml,
    verbose,
    dir,
    [key_njp]
  );

  await taskRunner(
    `Build ${file_parametersYaml}`,
    buildParameters,
    verbose,
    dir,
    [key_njp]
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
