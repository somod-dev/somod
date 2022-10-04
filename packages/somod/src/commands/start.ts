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
import { BuildAction } from "./build";
import { PrepareAction } from "./prepare";

type StartOptions = CommonOptions & {
  dev: boolean;
};

export const StartAction = async ({
  verbose,
  dev
}: StartOptions): Promise<void> => {
  const dir = findRootDir();

  await BuildAction({ verbose, ui: true, serverless: false });

  await PrepareAction({ verbose, ui: true, serverless: false });

  if (dev) {
    await taskRunner(
      `Watch ${path_ui}/${path_pages}`,
      watchRootModulePages,
      verbose,
      dir
    );
    await taskRunner(
      `Watch ${path_ui}/${path_pagesData}`,
      watchRootModulePagesData,
      verbose,
      dir
    );
    await taskRunner(
      `Watch ${path_ui}/${path_public}`,
      watchRootModulePublicAssets,
      verbose,
      dir
    );

    await taskRunner(
      `Start NextJs Development server`,
      nextCommand,
      verbose,
      dir,
      ["dev"]
    );
  } else {
    await taskRunner(`Build NextJS Project`, nextCommand, verbose, dir, [
      "build"
    ]);
    await taskRunner(`Start NextJS Server`, nextCommand, verbose, dir, [
      "start"
    ]);
  }
};

const startCommand = new Command("start");

startCommand.action(StartAction);

startCommand.addOption(
  new Option("-d, --dev", "Start a dev server in watch mode")
);
export default startCommand;