import { CommonOptions, taskRunner } from "@sodaru-cli/base";
import {
  file_gitIgnore,
  file_packageJson,
  file_templateYaml,
  file_tsConfigBuildJson,
  initGit,
  initLib,
  key_files,
  key_jsnextMain,
  key_module,
  key_njp,
  key_sideEffects,
  key_type,
  path_build,
  path_lib,
  path_samBuild,
  path_serverless,
  path_slpWorkingDir,
  saveGitIgnore,
  savePackageJson,
  setBuildInFilesInPackageJson,
  setModuleInPackageJson,
  setSideEffectsInPackageJson,
  setSlpInPackageJson,
  setTypingsInPackageJson,
  unsetJsnextMainInPackageJson,
  unsetTypeInPackageJson,
  updateGitIgnore,
  updateTsConfigBuildJson
} from "@sodaru-cli/package-manager-lib";
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
    `Set ${key_module} in ${file_packageJson}`,
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

  await Promise.all([
    taskRunner(`Initialise GIT`, initGit, verbose, dir),

    taskRunner(`Initialize ${file_gitIgnore}`, updateGitIgnore, verbose, dir, [
      `/${file_templateYaml}`,
      `/${path_slpWorkingDir}`,
      path_samBuild
    ]),

    taskRunner(`Intitalize ${path_lib}`, initLib, verbose, dir),

    taskRunner(
      `Intitalize ${file_tsConfigBuildJson}`,
      updateTsConfigBuildJson,
      verbose,
      dir,
      {},
      [path_serverless]
    )
  ]);

  await Promise.all([
    taskRunner(`Save ${file_packageJson}`, savePackageJson, verbose, dir),
    taskRunner(`Save ${file_gitIgnore}`, saveGitIgnore, verbose, dir)
  ]);
};

const initCommand = new Command("init");

initCommand.action(InitAction);

export default initCommand;
