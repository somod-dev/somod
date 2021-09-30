import { CommonOptions, taskRunner } from "@sodaru-cli/base";
import {
  file_eslintIgnore,
  file_gitIgnore,
  file_nextEnvDTs,
  file_packageJson,
  file_prettierIgnore,
  file_templateYaml,
  file_tsConfigBuildJson,
  file_tsConfigJson,
  initGit,
  initLib,
  initTemplateYaml,
  initWelcomePage,
  installAwsLambdaTypesAsDevDependency,
  installAwsSdkAsDevDependency,
  installAwsSdkAsPeerDependency,
  key_devDependencies,
  key_emp,
  key_files,
  key_jsnextMain,
  key_module,
  key_moduleAwsLambdaTypes,
  key_moduleAwsSdk,
  key_peerDependencies,
  key_sideEffects,
  key_type,
  key_typings,
  path_build,
  path_lib,
  path_nextBuild,
  path_pages,
  path_public,
  path_samBuild,
  path_samConfig,
  path_serverless,
  path_slpWorkingDir,
  path_ui,
  saveEslintIgnore,
  saveGitIgnore,
  savePackageJson,
  savePrettierIgnore,
  saveTsConfigBuildJson,
  setBuildInFilesInPackageJson,
  setEmpInPackageJson,
  setModuleInPackageJson,
  setSideEffectsInPackageJson,
  setTypingsInPackageJson,
  unsetJsnextMainInPackageJson,
  unsetTypeInPackageJson,
  updateEslintIgnore,
  updateGitIgnore,
  updatePrettierIgnore,
  updateTsConfigBuildJson
} from "@sodaru-cli/package-manager-lib";
import { Command } from "commander";

export const InitAction = async ({ verbose }: CommonOptions): Promise<void> => {
  const dir = process.cwd();
  await taskRunner(
    `Set ${key_emp} in ${file_packageJson}`,
    setEmpInPackageJson,
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

  const empIgnorePaths = [
    path_nextBuild,
    file_tsConfigJson,
    `/${path_pages}`,
    `/${path_public}`,
    file_nextEnvDTs,
    `/${file_templateYaml}`,
    `/${path_slpWorkingDir}`,
    path_samBuild,
    path_samConfig
  ];

  await Promise.all([
    taskRunner(`Initialise GIT`, initGit, verbose, dir),

    taskRunner(
      `Initialize ${file_gitIgnore}`,
      updateGitIgnore,
      verbose,
      dir,
      empIgnorePaths
    ),

    taskRunner(
      `Initialize ${file_prettierIgnore}`,
      updatePrettierIgnore,
      verbose,
      dir,
      empIgnorePaths
    ),

    taskRunner(
      `Initialize ${file_eslintIgnore}`,
      updateEslintIgnore,
      verbose,
      dir,
      empIgnorePaths
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
    taskRunner(
      `Save ${file_tsConfigBuildJson}`,
      saveTsConfigBuildJson,
      verbose,
      dir
    )
  ]);

  await taskRunner(
    `install ${key_moduleAwsSdk} in ${key_devDependencies}`,
    installAwsSdkAsDevDependency,
    verbose,
    dir
  );

  await taskRunner(
    `install ${key_moduleAwsSdk} in ${key_peerDependencies}`,
    installAwsSdkAsPeerDependency,
    verbose,
    dir
  );

  await taskRunner(
    `install ${key_moduleAwsLambdaTypes} in ${key_devDependencies}`,
    installAwsLambdaTypesAsDevDependency,
    verbose,
    dir
  );
};

const initCommand = new Command("init");

initCommand.action(InitAction);

export default initCommand;
