import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  createNextConfigJs,
  createNjpConfigJson,
  file_eslintIgnore,
  file_gitIgnore,
  file_nextConfigJs,
  file_nextEnvDTs,
  file_njpConfigJson,
  file_packageJson,
  file_prettierIgnore,
  file_samConfig,
  file_templateYaml,
  file_tsConfigBuildJson,
  file_tsConfigJson,
  file_vercelIgnore,
  initGit,
  initLib,
  initSodev,
  initTemplateYaml,
  initWelcomePage,
  key_somod,
  path_lib,
  path_nextBuild,
  path_pages,
  path_public,
  path_samBuild,
  path_serverless,
  path_ui,
  path_vercel,
  saveEslintIgnore,
  saveGitIgnore,
  savePackageJson,
  savePrettierIgnore,
  saveTsConfigBuildJson,
  saveVercelIgnore,
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
    key_somod
  );

  const somodIgnorePaths = [
    path_nextBuild,
    file_tsConfigJson,
    `/${path_pages}`,
    `/${path_public}`,
    file_nextEnvDTs,
    path_vercel,
    file_njpConfigJson,
    file_nextConfigJs,
    file_vercelIgnore,
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
      somodIgnorePaths
    ),

    taskRunner(
      `Initialize ${file_prettierIgnore}`,
      updatePrettierIgnore,
      verbose,
      dir,
      somodIgnorePaths
    ),

    taskRunner(
      `Initialize ${file_eslintIgnore}`,
      updateEslintIgnore,
      verbose,
      dir,
      somodIgnorePaths
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
    taskRunner(`Intitalize Welcome Page`, initWelcomePage, verbose, dir),
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
    taskRunner(`Save ${file_vercelIgnore}`, saveVercelIgnore, verbose, dir),
    taskRunner(
      `Save ${file_tsConfigBuildJson}`,
      saveTsConfigBuildJson,
      verbose,
      dir
    ),
    taskRunner(`Create ${file_nextConfigJs}`, createNextConfigJs, verbose, dir),
    taskRunner(
      `Create ${file_njpConfigJson}`,
      createNjpConfigJson,
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
