import { CommonOptions, taskRunner } from "@sodaru/cli-base";
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
  key_files,
  key_jsnextMain,
  key_module,
  key_njp,
  key_sideEffects,
  key_type,
  key_typings,
  path_build,
  path_lib,
  path_samBuild,
  path_serverless,
  saveEslintIgnore,
  saveGitIgnore,
  savePackageJson,
  savePrettierIgnore,
  saveTsConfigBuildJson,
  setBuildInFilesInPackageJson,
  setModuleInPackageJson,
  setSideEffectsInPackageJson,
  setSlpInPackageJson,
  setTypingsInPackageJson,
  unsetJsnextMainInPackageJson,
  unsetTypeInPackageJson,
  updateEslintIgnore,
  updateGitIgnore,
  updatePrettierIgnore,
  updateTsConfigBuildJson
} from "@somod/sdk-lib";
import { Command } from "commander";

export const InitAction = async ({ verbose }: CommonOptions): Promise<void> => {
  const dir = process.cwd();
  await taskRunner(
    `Set ${key_njp} in ${file_packageJson}`,
    setSlpInPackageJson,
    verbose,
    dir
  );
  await taskRunner(
    `Set ${key_module} in ${file_packageJson}`,
    setModuleInPackageJson,
    verbose,
    dir
  );
  await taskRunner(
    `Set ${key_typings} in ${file_packageJson}`,
    setTypingsInPackageJson,
    verbose,
    dir
  );
  await taskRunner(
    `Unset ${key_type} in ${file_packageJson}`,
    unsetTypeInPackageJson,
    verbose,
    dir
  );
  await taskRunner(
    `Set ${key_sideEffects} in ${file_packageJson}`,
    setSideEffectsInPackageJson,
    verbose,
    dir
  );
  await taskRunner(
    `Unset ${key_jsnextMain} in ${file_packageJson}`,
    unsetJsnextMainInPackageJson,
    verbose,
    dir
  );
  await taskRunner(
    `Include ${path_build} to ${key_files} in ${file_packageJson}`,
    setBuildInFilesInPackageJson,
    verbose,
    dir
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
      [path_serverless]
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
