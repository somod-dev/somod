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

type ServeOptions = CommonOptions & {
  dev: boolean;
};

export const ServeAction = async ({
  verbose,
  dev
}: ServeOptions): Promise<void> => {
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

const serveCommand = new Command("serve");

serveCommand.action(ServeAction);

serveCommand.addOption(
  new Option("-d, --dev", "Start a dev server in watch mode")
);
export default serveCommand;
