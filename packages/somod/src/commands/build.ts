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
  validateUiConfigYamlWithSchema,
  path_functions,
  validateFunctionExports,
  initializeContext,
  bundleExtension
} from "somod-lib";
import {
  addDebugOptions,
  addSOMODCommandTypeOptions,
  DebugModeOptions,
  getSOMODCommandTypeOptions,
  SOMODCommandTypeOptions
} from "../utils/common";

type BuildOptions = CommonOptions & SOMODCommandTypeOptions & DebugModeOptions;

export const BuildAction = async ({
  verbose,
  debug,
  ...options
}: BuildOptions): Promise<void> => {
  const dir = findRootDir();

  const { ui, serverless } = getSOMODCommandTypeOptions(options);

  const context = await taskRunner(
    `Initialize Context`,
    initializeContext,
    {
      verbose,
      progressIndicator: true
    },
    dir,
    ui,
    serverless,
    debug
  );

  await Promise.all([
    taskRunner(
      `Validate ${file_packageJson}`,
      validatePackageJson,
      { verbose, progressIndicator: true },
      context
    ),
    taskRunner(
      `Validate ${file_tsConfigSomodJson}`,
      isValidTsConfigSomodJson,
      { verbose, progressIndicator: true },
      context
    ),
    taskRunner(
      `Validate ${file_parametersYaml} with schema`,
      validateParametersWithSchema,
      { verbose, progressIndicator: true },
      context
    )
  ]);

  if (ui) {
    await Promise.all([
      taskRunner(
        `Validate ${path_ui}/${file_configYaml} with schema`,
        validateUiConfigYamlWithSchema,
        { verbose, progressIndicator: true },
        context
      ),
      taskRunner(
        `Validate ${path_ui}/${file_configYaml}`,
        validateUiConfigYaml,
        { verbose, progressIndicator: true },
        context
      ),
      taskRunner(
        `Validate exports in ${path_ui}/${path_pages}`,
        validatePageExports,
        { verbose, progressIndicator: true },
        context
      ),
      taskRunner(
        `Validate exports in ${path_ui}/${path_pagesData}`,
        validatePageData,
        { verbose, progressIndicator: true },
        context
      )
    ]);
  }

  if (serverless) {
    await taskRunner(
      `Validate ${path_serverless}/${file_templateYaml} with schema`,
      validateServerlessTemplateWithSchema,
      { verbose, progressIndicator: true },
      context
    );
    await taskRunner(
      `Validate ${path_serverless}/${file_templateYaml}`,
      validateServerlessTemplate,
      { verbose, progressIndicator: true },
      context
    );
    await taskRunner(
      `Validate exports in ${path_serverless}/${path_functions}`,
      validateFunctionExports,
      { verbose, progressIndicator: true },
      context
    );
  }

  const prebuildHooks = [...context.extensionHandler.prebuildHooks];
  prebuildHooks.reverse();
  for (const prebuildHook of prebuildHooks) {
    await taskRunner(
      `Run PreBuild Hook of ${prebuildHook.extension}`,
      prebuildHook.value,
      { verbose, progressIndicator: true },
      context
    );
  }

  await taskRunner(
    `Delete ${path_build} directory`,
    deleteBuildDir,
    { verbose, progressIndicator: true },
    context
  );

  await taskRunner(
    `Compile Typescript`,
    compileTypeScript,
    { verbose, progressIndicator: true },
    context,
    verbose
  );

  await taskRunner(
    `Bundle Extension`,
    bundleExtension,
    { verbose, progressIndicator: true },
    context,
    verbose
  );

  if (ui) {
    await taskRunner(
      `Build ${path_ui}/${path_public}`,
      buildUiPublic,
      { verbose, progressIndicator: true },
      context
    );

    await taskRunner(
      `Build ${path_ui}/${file_configYaml}`,
      buildUiConfigYaml,
      { verbose, progressIndicator: true },
      context
    );
  }

  if (serverless) {
    await taskRunner(
      `Build ${path_serverless}/${file_templateYaml}`,
      buildServerlessTemplate,
      { verbose, progressIndicator: true },
      context
    );
  }

  await taskRunner(
    `Build ${file_parametersYaml}`,
    buildParameters,
    { verbose, progressIndicator: true },
    context
  );

  await taskRunner(
    `Set ${key_somod} version in ${file_packageJson}`,
    updateSodaruModuleKeyInPackageJson,
    { verbose, progressIndicator: true },
    context.dir
  );
  await taskRunner(
    `Save ${file_packageJson}`,
    savePackageJson,
    { verbose, progressIndicator: true },
    context
  );

  for (const buildHook of context.extensionHandler.buildHooks) {
    await taskRunner(
      `Run Build Hook of ${buildHook.extension}`,
      buildHook.value,
      { verbose, progressIndicator: true },
      context
    );
  }
};

const buildCommand = new Command("build");

buildCommand.action(BuildAction);
addSOMODCommandTypeOptions(buildCommand);
addDebugOptions(buildCommand);

export default buildCommand;
