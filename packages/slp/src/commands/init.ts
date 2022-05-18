import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  file_eslintIgnore,
  file_gitIgnore,
  file_packageJson,
  file_prettierIgnore,
  file_samConfig,
  file_templateYaml,
  file_tsConfigBuildJson,
  initGit,
  initLib,
  initSodev,
  initTemplateYaml,
  key_slp,
  path_lib,
  path_samBuild,
  path_serverless,
  saveEslintIgnore,
  saveGitIgnore,
  savePackageJson,
  savePrettierIgnore,
  saveTsConfigBuildJson,
  updateEslintIgnore,
  updateGitIgnore,
  updatePackageJson,
  updatePrettierIgnore,
  updateTsConfigBuildJson
} from "@somod/sdk-lib";
import { Command } from "commander";

export const InitAction = async ({ verbose }: CommonOptions): Promise<void> => {
  const dir = process.cwd();
  await taskRunner(
    `Update ${file_packageJson}`,
    updatePackageJson,
    verbose,
    dir,
    key_slp
  );

  const slpIgnorePaths = [
    `/${file_templateYaml}`,
    path_samBuild,
    file_samConfig
  ];

  await Promise.all([
    taskRunner(`Initialise GIT`, initGit, verbose, dir),

    taskRunner(
      `Initialize ${file_gitIgnore}`,
      updateGitIgnore,
      verbose,
      dir,
      slpIgnorePaths
    ),

    taskRunner(
      `Initialize ${file_prettierIgnore}`,
      updatePrettierIgnore,
      verbose,
      dir,
      slpIgnorePaths
    ),

    taskRunner(
      `Initialize ${file_eslintIgnore}`,
      updateEslintIgnore,
      verbose,
      dir,
      slpIgnorePaths
    ),

    taskRunner(
      `Intitalize ${file_tsConfigBuildJson}`,
      updateTsConfigBuildJson,
      verbose,
      dir,
      {},
      []
    ),

    taskRunner(`Intitalize ${path_lib}`, initLib, verbose, dir),

    taskRunner(
      `Intitalize ${path_serverless}/${file_templateYaml}`,
      initTemplateYaml,
      verbose,
      dir
    )
  ]);

  await Promise.all([
    taskRunner(`Save ${file_packageJson}`, savePackageJson, verbose, dir),
    taskRunner(`Save ${file_gitIgnore}`, saveGitIgnore, verbose, dir),
    taskRunner(`Save ${file_prettierIgnore}`, savePrettierIgnore, verbose, dir),
    taskRunner(`Save ${file_eslintIgnore}`, saveEslintIgnore, verbose, dir),
    taskRunner(
      `Save ${file_tsConfigBuildJson}`,
      saveTsConfigBuildJson,
      verbose,
      dir
    )
  ]);

  await taskRunner(`run sodev prettier`, initSodev, verbose, dir, "prettier");
  await taskRunner(`run sodev eslint`, initSodev, verbose, dir, "eslint");
};

const initCommand = new Command("init");

initCommand.action(InitAction);

export default initCommand;
