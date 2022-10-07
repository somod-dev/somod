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
  loadPlugins,
  path_pages,
  path_public,
  runPluginPrepare,
  runPluginPreprepare,
  initializeModuleHandler,
  bundleFunctions,
  bundleFunctionLayers
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

  const plugins = await loadPlugins(dir);

  await taskRunner(
    `Initialize ModuleHandler`,
    initializeModuleHandler,
    { verbose, progressIndicator: true },
    dir,
    plugins.namespaceLoaders
  );

  await Promise.all(
    plugins.preprepare.map(plugin =>
      taskRunner(
        `PrePrepare plugin ${plugin.name}`,
        runPluginPreprepare,
        { verbose, progressIndicator: true },
        dir,
        plugin.plugin,
        {
          ui,
          serverless
        }
      )
    )
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
  }
  await taskRunner(
    `Create/Update /${file_parametersJson}`,
    generateRootParameters,
    { verbose, progressIndicator: true },
    dir
  );

  if (ui) {
    await taskRunner(
      `Gernerate /${file_nextConfigJs} and /${file_dotenv}`,
      generateNextConfig,
      { verbose, progressIndicator: true },
      dir,
      plugins.uiKeywords
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
      plugins.serverlessKeywords
    );
  }

  await Promise.all(
    plugins.prepare.map(plugin =>
      taskRunner(
        `Prepare plugin ${plugin.name}`,
        runPluginPrepare,
        { verbose, progressIndicator: true },
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

const prepareCommand = new Command("prepare");

prepareCommand.action(PrepareAction);
addSOMODCommandTypeOptions(prepareCommand);

export default prepareCommand;
