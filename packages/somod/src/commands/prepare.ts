import { Command, CommonOptions, taskRunner } from "nodejs-cli-runner";
import {
  bundleFunctionLayers,
  bundleFunctions,
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
  initializeContext,
  path_pages,
  path_public,
  prepareSAMTemplate
} from "somod-lib";
import {
  addDebugOptions,
  addSOMODCommandTypeOptions,
  DebugModeOptions,
  getSOMODCommandTypeOptions,
  SOMODCommandTypeOptions
} from "../utils/common";

type PrepareOptions = CommonOptions &
  DebugModeOptions &
  SOMODCommandTypeOptions;

export const PrepareAction = async ({
  verbose,
  debug,
  ...options
}: PrepareOptions): Promise<void> => {
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

  for (const preprepareHook of context.extensionHandler.preprepareHooks) {
    await taskRunner(
      `Run PrePrepare Hook of ${preprepareHook.extension}`,
      preprepareHook.value,
      { verbose, progressIndicator: true },
      context
    );
  }

  await taskRunner(
    `Create/Update /${file_parametersJson}`,
    generateRootParameters,
    { verbose, progressIndicator: true },
    context
  );

  if (ui) {
    await taskRunner(
      `Deleting /${path_pages} and /${path_public}`,
      deletePagesAndPublicDir,
      { verbose, progressIndicator: true },
      context
    );
    await taskRunner(
      `Create /${path_pages}`,
      createPages,
      { verbose, progressIndicator: true },
      context
    );
    await taskRunner(
      `Create /${path_public}`,
      createPublicAssets,
      { verbose, progressIndicator: true },
      context
    );

    await taskRunner(
      `Gernerate /${file_nextConfigJs} and /${file_dotenv}`,
      generateNextConfig,
      { verbose, progressIndicator: true },
      context
    );
  }
  if (serverless) {
    await taskRunner(
      `Bundle Serverless Functions`,
      bundleFunctions,
      { verbose, progressIndicator: true },
      context,
      verbose
    );

    await taskRunner(
      `Bundle Serverless FunctionLayers`,
      bundleFunctionLayers,
      { verbose, progressIndicator: true },
      context,
      verbose
    );

    await taskRunner(
      `Generate /${file_templateYaml}`,
      prepareSAMTemplate,
      { verbose, progressIndicator: true },
      context
    );
  }

  const prepareHooks = [...context.extensionHandler.prepareHooks];
  prepareHooks.reverse();
  for (const prepareHook of prepareHooks) {
    await taskRunner(
      `Run Prepare Hook of ${prepareHook.extension}`,
      prepareHook.value,
      { verbose, progressIndicator: true },
      context
    );
  }
};

const prepareCommand = new Command("prepare");

prepareCommand.action(PrepareAction);
addSOMODCommandTypeOptions(prepareCommand);
addDebugOptions(prepareCommand);

export default prepareCommand;
