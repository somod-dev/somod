import { CommonOptions, taskRunner, Command, Option } from "nodejs-cli-runner";
import {
  findRootDir,
  nextCommand,
  path_pages,
  path_pagesData,
  path_public,
  path_ui,
  watchRootModulePages,
  watchRootModulePagesData,
  watchRootModulePublicAssets
} from "somod-lib";
import { addDebugOptions, DebugModeOptions } from "../utils/common";
import { BuildAction } from "./build";
import { PrepareAction } from "./prepare";

type StartOptions = CommonOptions &
  DebugModeOptions & {
    dev: boolean;
  };

export const StartAction = async ({
  verbose,
  debug,
  dev
}: StartOptions): Promise<void> => {
  const dir = findRootDir();

  await BuildAction({ verbose, ui: true, serverless: false, debug });

  await PrepareAction({ verbose, ui: true, serverless: false, debug });

  if (dev) {
    await taskRunner(
      `Watch ${path_ui}/${path_pages}`,
      watchRootModulePages,
      { verbose, progressIndicator: true },
      dir
    );
    await taskRunner(
      `Watch ${path_ui}/${path_pagesData}`,
      watchRootModulePagesData,
      { verbose, progressIndicator: true },
      dir
    );
    await taskRunner(
      `Watch ${path_ui}/${path_public}`,
      watchRootModulePublicAssets,
      { verbose, progressIndicator: true },
      dir
    );

    await taskRunner(
      `Start NextJs Development server`,
      nextCommand,
      { verbose, progressIndicator: false },
      dir,
      ["dev"]
    );
  } else {
    await taskRunner(
      `Build NextJS Project`,
      nextCommand,
      { verbose, progressIndicator: false },
      dir,
      ["build"]
    );
    await taskRunner(
      `Start NextJS Server`,
      nextCommand,
      { verbose, progressIndicator: false },
      dir,
      ["start"]
    );
  }
};

const startCommand = new Command("start");

startCommand.action(StartAction);

startCommand.addOption(
  new Option("-d, --dev", "Start a dev server in watch mode")
);
addDebugOptions(startCommand);
export default startCommand;
