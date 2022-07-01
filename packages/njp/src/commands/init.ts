import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  file_dotenv,
  file_eslintIgnore,
  file_gitIgnore,
  file_nextConfigJs,
  file_nextEnvDTs,
  file_packageJson,
  file_prettierIgnore,
  file_tsConfigBuildJson,
  file_tsConfigJson,
  initLib,
  initWelcomePage,
  key_njp,
  path_build,
  path_lib,
  path_nextBuild,
  path_pages,
  path_public,
  path_ui,
  saveIgnore,
  savePackageJson,
  saveTsConfigBuildJson,
  sodev,
  updateIgnore,
  updatePackageJson,
  updateTsConfigBuildJson
} from "@somod/sdk-lib";
import { Command } from "commander";

export const InitAction = async ({ verbose }: CommonOptions): Promise<void> => {
  const dir = process.cwd();

  await taskRunner(`run sodev git`, sodev, verbose, dir, "git");
  await taskRunner(`run sodev prettier`, sodev, verbose, dir, "prettier");
  await taskRunner(`run sodev eslint`, sodev, verbose, dir, "eslint");

  const njpIgnorePaths = [
    path_build,
    path_nextBuild,
    file_tsConfigJson,
    `/${path_pages}`,
    `/${path_public}`,
    file_nextEnvDTs,
    file_dotenv,
    file_nextConfigJs
  ];

  await Promise.all([
    taskRunner(
      `update ${file_packageJson}`,
      updatePackageJson,
      verbose,
      dir,
      key_njp
    ),

    taskRunner(
      `Initialize ${file_gitIgnore}`,
      updateIgnore,
      verbose,
      dir,
      file_gitIgnore,
      njpIgnorePaths
    ),

    taskRunner(
      `Initialize ${file_prettierIgnore}`,
      updateIgnore,
      verbose,
      dir,
      file_prettierIgnore,
      njpIgnorePaths
    ),

    taskRunner(
      `Initialize ${file_eslintIgnore}`,
      updateIgnore,
      verbose,
      dir,
      file_eslintIgnore,
      njpIgnorePaths
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
    taskRunner(
      `Save ${file_gitIgnore}`,
      saveIgnore,
      verbose,
      dir,
      file_gitIgnore
    ),
    taskRunner(
      `Save ${file_prettierIgnore}`,
      saveIgnore,
      verbose,
      dir,
      file_prettierIgnore
    ),
    taskRunner(
      `Save ${file_eslintIgnore}`,
      saveIgnore,
      verbose,
      dir,
      file_eslintIgnore
    ),
    taskRunner(
      `Save ${file_tsConfigBuildJson}`,
      saveTsConfigBuildJson,
      verbose,
      dir
    )
  ]);
};

const initCommand = new Command("init");

initCommand.action(InitAction);

export default initCommand;
