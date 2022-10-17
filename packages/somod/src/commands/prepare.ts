import { CommonOptions, taskRunner, Command } from "nodejs-cli-runner";
import {
  createPages,
  createPublicAssets,
  deletePagesAndPublicDir,
  file_dotenv,
  file_nextConfigJs,
  file_parametersJson,
  file_templateYaml,
  findRootDir,
  generateNextConfig,
  generateRootParameters,
  prepareSAMTemplate,
  path_pages,
  path_public,
  initializeModuleHandler,
  bundleFunctions,
  bundleFunctionLayers,
  loadLifeCycleHooks,
  appendNamespaceLoaders,
  runPrepareLifeCycleHook,
  runPreprepareLifeCycleHook
} from "somod-lib";
import {
  addSOMODCommandTypeOptions,
  getSOMODCommandTypeOptions,
  SOMODCommandTypeOptions
} from "../utils/common";

type PrepareOptions = CommonOptions & SOMODCommandTypeOptions;

export const PrepareAction = async ({
  verbose,
  ...options
}: PrepareOptions): Promise<void> => {
  const dir = findRootDir();

  const { ui, serverless } = getSOMODCommandTypeOptions(options);

  await taskRunner(
    `Initialize ModuleHandler`,
    initializeModuleHandler,
    { verbose, progressIndicator: true },
    dir
  );

  const moduleLifeCycleHooks = await loadLifeCycleHooks();

  try {
    await appendNamespaceLoaders(moduleLifeCycleHooks.namespaceLoaders);
  } catch (e) {
    // NOTE:  This is the case when called from deploy,
    // In deploy, build command is called before prepare, so the namespaces are already resolved in the build step.
    if (
      e.message !=
      "new namespaces can not be appended after namespace are resolved"
    ) {
      throw e;
    }
  }

  await Promise.all(
    moduleLifeCycleHooks.preprepare.map(plugin =>
      taskRunner(
        `Run PrePrepare Hook of ${plugin.name}`,
        runPreprepareLifeCycleHook,
        { verbose, progressIndicator: true },
        dir,
        plugin.lifeCycle,
        {
          ui,
          serverless
        }
      )
    )
  );

  await taskRunner(
    `Create/Update /${file_parametersJson}`,
    generateRootParameters,
    { verbose, progressIndicator: true },
    dir
  );

  if (ui) {
    await taskRunner(
      `Deleting /${path_pages} and /${path_public}`,
      deletePagesAndPublicDir,
      { verbose, progressIndicator: true },
      dir
    );
    await taskRunner(
      `Create /${path_pages}`,
      createPages,
      { verbose, progressIndicator: true },
      dir
    );
    await taskRunner(
      `Create /${path_public}`,
      createPublicAssets,
      { verbose, progressIndicator: true },
      dir
    );

    await taskRunner(
      `Gernerate /${file_nextConfigJs} and /${file_dotenv}`,
      generateNextConfig,
      { verbose, progressIndicator: true },
      dir,
      moduleLifeCycleHooks.uiKeywords
    );
  }
  if (serverless) {
    await taskRunner(
      `Bundle Serverless Functions`,
      bundleFunctions,
      { verbose, progressIndicator: true },
      dir
    );

    await taskRunner(
      `Bundle Serverless FunctionLayers`,
      bundleFunctionLayers,
      { verbose, progressIndicator: true },
      dir,
      verbose
    );

    await taskRunner(
      `Generate /${file_templateYaml}`,
      prepareSAMTemplate,
      { verbose, progressIndicator: true },
      dir,
      moduleLifeCycleHooks.serverlessKeywords
    );
  }

  await Promise.all(
    moduleLifeCycleHooks.prepare.map(plugin =>
      taskRunner(
        `Run Prepare Hook of ${plugin.name}`,
        runPrepareLifeCycleHook,
        { verbose, progressIndicator: true },
        dir,
        plugin.lifeCycle,
        {
          ui,
          serverless
        }
      )
    )
  );
};

const prepareCommand = new Command("prepare");

prepareCommand.action(PrepareAction);
addSOMODCommandTypeOptions(prepareCommand);

export default prepareCommand;
