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
  validateServerlessTemplate,
  initializeModuleHandler,
  validateUiConfigYamlWithSchema,
  loadNamespaces,
  path_functions,
  validateFunctionExports,
  loadLifeCycleHooks,
  appendNamespaceLoaders,
  runPrebuildLifeCycleHook,
  runBuildLifeCycleHook,
  bundleLifeCycleHook
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

  await taskRunner(
    `Initialize ModuleHandler`,
    initializeModuleHandler,
    { verbose, progressIndicator: true },
    dir
  );

  const moduleLifeCycleHooks = await loadLifeCycleHooks();

  await appendNamespaceLoaders(moduleLifeCycleHooks.namespaceLoaders);

  await Promise.all([
    taskRunner(
      `Validate ${file_packageJson}`,
      validatePackageJson,
      { verbose, progressIndicator: true },
      dir
    ),
    taskRunner(
      `Validate ${file_tsConfigSomodJson}`,
      isValidTsConfigSomodJson,
      { verbose, progressIndicator: true },
      dir,
      ui ? { jsx: "react-jsx" } : {},
      [...(ui ? [path_ui] : []), ...(serverless ? [path_serverless] : [])]
    ),
    taskRunner(
      `Validate ${file_parametersYaml} with schema`,
      validateParametersWithSchema,
      { verbose, progressIndicator: true },
      dir
    )
  ]);

  if (ui) {
    await Promise.all([
      taskRunner(
        `Validate ${path_ui}/${file_configYaml} with schema`,
        validateUiConfigYamlWithSchema,
        { verbose, progressIndicator: true },
        dir
      ),
      taskRunner(
        `Validate ${path_ui}/${file_configYaml}`,
        validateUiConfigYaml,
        { verbose, progressIndicator: true },
        dir,
        moduleLifeCycleHooks.uiKeywords
      ),
      taskRunner(
        `Validate exports in ${path_ui}/${path_pages}`,
        validatePageExports,
        { verbose, progressIndicator: true },
        dir
      ),
      taskRunner(
        `Validate exports in ${path_ui}/${path_pagesData}`,
        validatePageData,
        { verbose, progressIndicator: true },
        dir
      )
    ]);
  }

  if (serverless) {
    await taskRunner(
      `Validate ${path_serverless}/${file_templateYaml} with schema`,
      validateServerlessTemplateWithSchema,
      { verbose, progressIndicator: true },
      dir
    );
    await taskRunner(
      `Validate ${path_serverless}/${file_templateYaml}`,
      validateServerlessTemplate,
      { verbose, progressIndicator: true },
      dir,
      moduleLifeCycleHooks.serverlessKeywords
    );
    await taskRunner(
      `Validate exports in ${path_serverless}/${path_functions}`,
      validateFunctionExports,
      { verbose, progressIndicator: true },
      dir
    );
  }

  await taskRunner(`Resolve Namespaces`, loadNamespaces, {
    verbose,
    progressIndicator: true
  });

  await Promise.all(
    moduleLifeCycleHooks.prebuild.map(hook =>
      taskRunner(
        `Run PreBuild Hook of ${hook.name}`,
        runPrebuildLifeCycleHook,
        { verbose, progressIndicator: true },
        dir,
        hook.lifeCycle,
        { ui, serverless }
      )
    )
  );

  await taskRunner(
    `Delete ${path_build} directory`,
    deleteBuildDir,
    { verbose, progressIndicator: true },
    dir
  );

  await taskRunner(
    `Compile Typescript`,
    compileTypeScript,
    { verbose, progressIndicator: true },
    dir
  );

  await taskRunner(
    `Bundle lifeCycle hooks`,
    bundleLifeCycleHook,
    { verbose, progressIndicator: true },
    dir
  );

  if (ui) {
    await taskRunner(
      `Build ${path_ui}/${path_public}`,
      buildUiPublic,
      { verbose, progressIndicator: true },
      dir
    );

    await taskRunner(
      `Build ${path_ui}/${file_configYaml}`,
      buildUiConfigYaml,
      { verbose, progressIndicator: true },
      dir
    );
  }

  if (serverless) {
    await taskRunner(
      `Build ${path_serverless}/${file_templateYaml}`,
      buildServerlessTemplate,
      { verbose, progressIndicator: true },
      dir
    );
  }

  await taskRunner(
    `Build ${file_parametersYaml}`,
    buildParameters,
    { verbose, progressIndicator: true },
    dir
  );

  await taskRunner(
    `Set ${key_somod} version in ${file_packageJson}`,
    updateSodaruModuleKeyInPackageJson,
    { verbose, progressIndicator: true },
    dir
  );
  await taskRunner(
    `Save ${file_packageJson}`,
    savePackageJson,
    { verbose, progressIndicator: true },
    dir
  );

  await Promise.all(
    moduleLifeCycleHooks.build.map(hook =>
      taskRunner(
        `Run Build Hook of ${hook.name}`,
        runBuildLifeCycleHook,
        { verbose, progressIndicator: true },
        dir,
        hook.lifeCycle,
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
