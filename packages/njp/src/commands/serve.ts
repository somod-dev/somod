import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  findRootDir,
  nextCommand,
  path_pages,
  path_public,
  path_ui,
  watchRootModulePages,
  watchRootModulePublicAssets
} from "@somod/sdk-lib";
import { Command, Option } from "commander";
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

  await BuildAction({ verbose });

  await PrepareAction({ verbose });

  if (dev) {
    await taskRunner(
      `Watch ${path_ui}/${path_pages}`,
      watchRootModulePages,
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
