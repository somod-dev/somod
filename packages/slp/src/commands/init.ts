import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  file_eslintIgnore,
  file_gitIgnore,
  file_packageJson,
  file_parametersYaml,
  file_prettierIgnore,
  file_samConfig,
  file_templateYaml,
  file_tsConfigBuildJson,
  findRootDir,
  initLib,
  initParametersYaml,
  initTemplateYaml,
  key_slp,
  path_lib,
  path_samBuild,
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
  const dir = findRootDir();

  await taskRunner(`run sodev git`, sodev, verbose, dir, "git");
  await taskRunner(`run sodev prettier`, sodev, verbose, dir, "prettier");
  await taskRunner(`run sodev eslint`, sodev, verbose, dir, "eslint");

  const slpIgnorePaths = [
    `/${file_templateYaml}`,
    path_samBuild,
    file_samConfig
  ];

  await Promise.all([
    taskRunner(
      `update ${file_packageJson}`,
      updatePackageJson,
      verbose,
      dir,
      key_slp
    ),

    taskRunner(
      `Initialize ${file_gitIgnore}`,
      updateIgnore,
      verbose,
      dir,
      file_gitIgnore,
      slpIgnorePaths
    ),

    taskRunner(
      `Initialize ${file_prettierIgnore}`,
      updateIgnore,
      verbose,
      dir,
      file_prettierIgnore,
      [...slpIgnorePaths, file_tsConfigBuildJson]
    ),

    taskRunner(
      `Initialize ${file_eslintIgnore}`,
      updateIgnore,
      verbose,
      dir,
      file_eslintIgnore,
      slpIgnorePaths
    ),

    taskRunner(
      `Intitalize ${file_tsConfigBuildJson}`,
      updateTsConfigBuildJson,
      verbose,
      dir
    ),

    taskRunner(`Intitalize ${path_lib}`, initLib, verbose, dir),
    taskRunner(
      `Intitalize Serverless Template`,
      initTemplateYaml,
      verbose,
      dir
    ),
    taskRunner(
      `Initialize ${file_parametersYaml}`,
      initParametersYaml,
      verbose,
      dir
    )
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
