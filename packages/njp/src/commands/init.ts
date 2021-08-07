import {
  initGit,
  initLib,
  initWelcomePage,
  saveGitIgnore,
  savePackageJson,
  saveTsConfigBuildJson,
  setModuleInPackageJson,
  setNjpInPackageJson,
  setSideEffectsInPackageJson,
  unsetTypeInPackageJson,
  unsetJsnextMainInPackageJson,
  updateGitIgnore,
  updateTsConfigBuildJson,
  file_packageJson,
  key_njp,
  key_module,
  key_type,
  key_sideEffects,
  key_jsnextMain,
  file_gitIgnore,
  file_tsConfigJson,
  path_nextBuild,
  path_pages,
  path_public,
  file_nextEnvDTs,
  path_ui,
  file_tsConfigBuildJson,
  path_lib,
  CommonOptions,
  taskRunner
} from "@sodaru/package-manager-lib";
import { Command } from "commander";

export const InitAction = async ({ verbose }: CommonOptions): Promise<void> => {
  const dir = process.cwd();
  await taskRunner(
    `Set ${key_njp} in ${file_packageJson}`,
    setNjpInPackageJson,
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

  await Promise.all([
    taskRunner(`Initialise GIT`, initGit, verbose, dir),

    taskRunner(`Initialize ${file_gitIgnore}`, updateGitIgnore, verbose, dir, [
      path_nextBuild,
      file_tsConfigJson,
      `/${path_pages}`,
      `/${path_public}`,
      file_nextEnvDTs
    ]),

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
