import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  file_dotenv,
  file_eslintIgnore,
  file_gitIgnore,
  file_nextConfigJs,
  file_nextEnvDTs,
  file_packageJson,
  file_parametersJson,
  file_prettierIgnore,
  file_samConfig,
  file_templateYaml,
  file_tsConfigBuildJson,
  file_tsConfigJson,
  findRootDir,
  initFiles,
  loadPlugins,
  path_nextBuild,
  path_pages,
  path_public,
  path_samBuild,
  path_ui,
  runPluginInit,
  saveIgnore,
  savePackageJson,
  saveTsConfigBuildJson,
  sodev,
  updateIgnore,
  updatePackageJson,
  updateTsConfigBuildJson
} from "@somod/sdk-lib";
import { Command } from "commander";
import {
  addSOMODCommandTypeOptions,
  getSOMODCommandTypeOptions,
  SOMODCommandTypeOptions
} from "../utils/common";

const uniq = <T = unknown>(a: T[]): T[] => {
  return Array.from(new Set(a));
};

type InitOptions = CommonOptions & SOMODCommandTypeOptions;

export const InitAction = async ({
  verbose,
  ...options
}: InitOptions): Promise<void> => {
  const dir = findRootDir();

  const { ui, serverless } = getSOMODCommandTypeOptions(options);

  const plugins = await loadPlugins(dir);

  await taskRunner(`run sodev git`, sodev, verbose, dir, "git");
  await taskRunner(`run sodev prettier`, sodev, verbose, dir, "prettier");
  await taskRunner(`run sodev eslint`, sodev, verbose, dir, "eslint", ["next"]);

  const somodIgnorePaths = [`/${file_parametersJson}`];

  if (ui) {
    somodIgnorePaths.push(
      ...[
        path_nextBuild,
        file_tsConfigJson,
        `/${path_pages}`,
        `/${path_public}`,
        file_nextEnvDTs,
        file_dotenv,
        file_nextConfigJs
      ]
    );
  }

  if (serverless) {
    somodIgnorePaths.push(
      ...[path_samBuild, `/${file_templateYaml}`, file_samConfig]
    );
  }

  await Promise.all([
    taskRunner(`update ${file_packageJson}`, updatePackageJson, verbose, dir),

    taskRunner(
      `Initialize ${file_gitIgnore}`,
      updateIgnore,
      verbose,
      dir,
      file_gitIgnore,
      uniq([...somodIgnorePaths, ...plugins.ignorePatterns.git])
    ),

    taskRunner(
      `Initialize ${file_prettierIgnore}`,
      updateIgnore,
      verbose,
      dir,
      file_prettierIgnore,
      uniq([
        ...somodIgnorePaths,
        file_tsConfigBuildJson,
        ...plugins.ignorePatterns.prettier
      ])
    ),

    taskRunner(
      `Initialize ${file_eslintIgnore}`,
      updateIgnore,
      verbose,
      dir,
      file_eslintIgnore,
      uniq([...somodIgnorePaths, ...plugins.ignorePatterns.eslint])
    ),

    taskRunner(
      `Intitalize ${file_tsConfigBuildJson}`,
      updateTsConfigBuildJson,
      verbose,
      dir,
      { jsx: "react", ...plugins.tsconfig.compilerOptions },
      [path_ui, ...plugins.tsconfig.include]
    ),

    taskRunner(
      `Intitalize Sample Project files`,
      initFiles,
      verbose,
      dir,
      ui,
      serverless
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
  await Promise.all(
    plugins.init.map(plugin =>
      taskRunner(
        `Initializing plugin ${plugin.name}`,
        runPluginInit,
        verbose,
        dir,
        plugin.plugin,
        {
          ui,
          serverless
        }
      )
    )
  );
};

const initCommand = new Command("init");

initCommand.action(InitAction);
addSOMODCommandTypeOptions(initCommand);

export default initCommand;
