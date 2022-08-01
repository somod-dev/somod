import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  buildParameters,
  buildServerlessTemplate,
  buildUiConfigYaml,
  buildUiPublic,
  bundleFunctions,
  compileTypeScript,
  deleteBuildDir,
  validatePageData,
  validatePageExports,
  doesServerlessFunctionsHaveDefaultExport,
  file_configYaml,
  file_packageJson,
  file_parametersYaml,
  file_templateYaml,
  file_tsConfigBuildJson,
  findRootDir,
  installLayerDependencies,
  isValidTsConfigBuildJson,
  key_somod,
  loadAndResolveNamespaces,
  path_build,
  path_functions,
  path_pages,
  path_public,
  path_serverless,
  path_ui,
  savePackageJson,
  updateSodaruModuleKeyInPackageJson,
  validatePackageJson,
  validateParametersWithSchema,
  validateServerlessTemplateWithSchema,
  validateUiConfigYaml,
  path_pagesData,
  loadPlugins,
  loadPluginNamespace,
  runPluginPrebuild,
  runPluginBuild
} from "@somod/sdk-lib";
import { Command } from "commander";
import {
  addSOMODCommandTypeOptions,
  getSOMODCommandTypeOptions,
  SOMODCommandTypeOptions
} from "../utils/common";

type BuildOptions = CommonOptions & SOMODCommandTypeOptions;

export const BuildAction = async ({
  verbose,
  ...options
}: BuildOptions): Promise<void> => {
  const dir = findRootDir();

  const { ui, serverless } = getSOMODCommandTypeOptions(options);

  const plugins = await loadPlugins(dir);

  await Promise.all([
    taskRunner(
      `Validate ${file_packageJson}`,
      validatePackageJson,
      verbose,
      dir
    ),
    taskRunner(
      `Validate ${file_tsConfigBuildJson}`,
      isValidTsConfigBuildJson,
      verbose,
      dir,
      ui ? { jsx: "react" } : {},
      ui ? [path_ui] : []
    ),
    taskRunner(
      `Validate ${file_parametersYaml} with schema`,
      validateParametersWithSchema,
      verbose,
      dir
    )
  ]);
  if (ui) {
    await Promise.all([
      taskRunner(
        `Validate ${path_ui}/${file_configYaml} with schema`,
        validateUiConfigYaml,
        verbose,
        dir
      ),
      taskRunner(
        `Validate exports in ${path_ui}/${path_pages}`,
        validatePageExports,
        verbose,
        dir
      ),
      taskRunner(
        `Validate exports in ${path_ui}/${path_pagesData}`,
        validatePageData,
        verbose,
        dir
      )
    ]);
  }

  if (serverless) {
    await Promise.all([
      taskRunner(
        `Validate ${path_serverless}/${file_templateYaml} with schema`,
        validateServerlessTemplateWithSchema,
        verbose,
        dir
      ),
      taskRunner(
        `Check if ${path_serverless}/${path_functions} have default export`,
        doesServerlessFunctionsHaveDefaultExport,
        verbose,
        dir
      )
    ]);
  }

  await taskRunner(
    `Resolve Namespaces`,
    loadAndResolveNamespaces,
    verbose,
    dir,
    ui,
    serverless
  );

  await Promise.all(
    plugins.namespace.map(plugin =>
      taskRunner(
        `Resolve Namespaces in plugin ${plugin.name}`,
        loadPluginNamespace,
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

  await Promise.all(
    plugins.prebuild.map(plugin =>
      taskRunner(
        `PreBuild plugin ${plugin.name}`,
        runPluginPrebuild,
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

  await taskRunner(
    `Delete ${path_build} directory`,
    deleteBuildDir,
    verbose,
    dir
  );
  await taskRunner(`Compile Typescript`, compileTypeScript, verbose, dir);

  if (ui) {
    await taskRunner(
      `Build ${path_ui}/${path_public}`,
      buildUiPublic,
      verbose,
      dir
    );

    await taskRunner(
      `Build ${path_ui}/${file_configYaml}`,
      buildUiConfigYaml,
      verbose,
      dir
    );
  }

  if (serverless) {
    await taskRunner(
      `Build ${path_serverless}/${file_templateYaml}`,
      buildServerlessTemplate,
      verbose,
      dir
    );

    await taskRunner(
      `Bundle Serverless Functions`,
      bundleFunctions,
      verbose,
      dir
    );

    await taskRunner(
      `Install libraries of Serverless FunctionLayers`,
      installLayerDependencies,
      verbose,
      dir,
      verbose
    );
  }

  await taskRunner(
    `Build ${file_parametersYaml}`,
    buildParameters,
    verbose,
    dir
  );

  await taskRunner(
    `Set ${key_somod} version in ${file_packageJson}`,
    updateSodaruModuleKeyInPackageJson,
    verbose,
    dir
  );
  await taskRunner(`Save ${file_packageJson}`, savePackageJson, verbose, dir);

  await Promise.all(
    plugins.build.map(plugin =>
      taskRunner(
        `Build plugin ${plugin.name}`,
        runPluginBuild,
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

const buildCommand = new Command("build");

buildCommand.action(BuildAction);
addSOMODCommandTypeOptions(buildCommand);

export default buildCommand;
