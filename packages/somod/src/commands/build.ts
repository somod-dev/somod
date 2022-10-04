import { CommonOptions, taskRunner, Command } from "nodejs-cli-runner";
import {
  buildParameters,
  buildServerlessTemplate,
  buildUiConfigYaml,
  buildUiPublic,
  compileTypeScript,
  deleteBuildDir,
  validatePageData,
  validatePageExports,
  file_configYaml,
  file_packageJson,
  file_parametersYaml,
  file_templateYaml,
  file_tsConfigSomodJson,
  findRootDir,
  isValidTsConfigSomodJson,
  key_somod,
  path_build,
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
  runPluginPrebuild,
  runPluginBuild,
  validateServerlessTemplate,
  initializeModuleHandler,
  validateUiConfigYamlWithSchema,
  loadNamespaces,
  path_functions,
  validateFunctionExports
} from "somod-lib";
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

  await taskRunner(
    `Initialize ModuleHandler`,
    initializeModuleHandler,
    verbose,
    dir,
    plugins.namespaceLoaders
  );

  await Promise.all([
    taskRunner(
      `Validate ${file_packageJson}`,
      validatePackageJson,
      verbose,
      dir
    ),
    taskRunner(
      `Validate ${file_tsConfigSomodJson}`,
      isValidTsConfigSomodJson,
      verbose,
      dir,
      ui ? { jsx: "react-jsx" } : {},
      [...(ui ? [path_ui] : []), ...(serverless ? [path_serverless] : [])]
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
        validateUiConfigYamlWithSchema,
        verbose,
        dir
      ),
      taskRunner(
        `Validate ${path_ui}/${file_configYaml}`,
        validateUiConfigYaml,
        verbose,
        dir,
        plugins.uiKeywords
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
    await taskRunner(
      `Validate ${path_serverless}/${file_templateYaml} with schema`,
      validateServerlessTemplateWithSchema,
      verbose,
      dir
    );
    await taskRunner(
      `Validate ${path_serverless}/${file_templateYaml}`,
      validateServerlessTemplate,
      verbose,
      dir,
      plugins.serverlessKeywords
    );
    await taskRunner(
      `Validate exports in ${path_serverless}/${path_functions}`,
      validateFunctionExports,
      verbose,
      dir
    );
  }

  await taskRunner(`Resolve Namespaces`, loadNamespaces, verbose);

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
