import { CommonOptions, taskRunner } from "@sodaru/cli-base";
import {
  file_dotenv,
  file_eslintIgnore,
  file_gitIgnore,
  file_nextEnvDTs,
  file_packageJson,
  file_prettierIgnore,
  file_tsConfigBuildJson,
  file_tsConfigJson,
  file_vercelIgnore,
  initGit,
  initLib,
  initSodev,
  initWelcomePage,
  key_njp,
  path_lib,
  path_nextBuild,
  path_njp_working_dir,
  path_pages,
  path_public,
  path_ui,
  saveEslintIgnore,
  saveGitIgnore,
  savePackageJson,
  savePrettierIgnore,
  saveTsConfigBuildJson,
  updateEslintIgnore,
  updateGitIgnore,
  updatePackageJson,
  updatePrettierIgnore,
  updateVercelIgnore,
  updateTsConfigBuildJson,
  saveVercelIgnore,
  file_npmrc,
  file_nextConfigJs
} from "@somod/sdk-lib";
import { Command } from "commander";

export const InitAction = async ({ verbose }: CommonOptions): Promise<void> => {
  const dir = process.cwd();
  await taskRunner(
    `update ${file_packageJson}`,
    updatePackageJson,
    verbose,
    dir,
    key_njp
  );

  const njpIgnorePaths = [
    path_nextBuild,
    file_tsConfigJson,
    `/${path_pages}`,
    `/${path_public}`,
    file_nextEnvDTs,
    path_njp_working_dir
  ];

  await Promise.all([
    taskRunner(`Initialise GIT`, initGit, verbose, dir),

    taskRunner(
      `Initialize ${file_gitIgnore}`,
      updateGitIgnore,
      verbose,
      dir,
      njpIgnorePaths
    ),

    taskRunner(
      `Initialize ${file_prettierIgnore}`,
      updatePrettierIgnore,
      verbose,
      dir,
      njpIgnorePaths
    ),

    taskRunner(
      `Initialize ${file_eslintIgnore}`,
      updateEslintIgnore,
      verbose,
      dir,
      njpIgnorePaths
    ),

    taskRunner(
      `Initialize ${file_vercelIgnore}`,
      updateVercelIgnore,
      verbose,
      dir,
      [
        "/*",
        `!${path_lib}`,
        `!${path_ui}`,
        `!${path_pages}`,
        `!${path_public}`,
        `!${file_dotenv}`,
        `!${file_npmrc}`,
        `!${file_prettierIgnore}`,
        `!${file_eslintIgnore}`,
        `!${file_nextConfigJs}`,
        `!${file_packageJson}`
      ]
    ),

    taskRunner(
      `Intitalize ${file_tsConfigBuildJson}`,
      updateTsConfigBuildJson,
      verbose,
      dir,
      { jsx: "react" },
      [path_ui]
    ),

    taskRunner(`Intitalize ${path_lib}`, initLib, verbose, dir),
    taskRunner(`Intitalize Welcome Page`, initWelcomePage, verbose, dir)
  ]);

  await Promise.all([
    taskRunner(`Save ${file_packageJson}`, savePackageJson, verbose, dir),
    taskRunner(`Save ${file_gitIgnore}`, saveGitIgnore, verbose, dir),
    taskRunner(`Save ${file_prettierIgnore}`, savePrettierIgnore, verbose, dir),
    taskRunner(`Save ${file_eslintIgnore}`, saveEslintIgnore, verbose, dir),
    taskRunner(`Save ${file_vercelIgnore}`, saveVercelIgnore, verbose, dir),
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
