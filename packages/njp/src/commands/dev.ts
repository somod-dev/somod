import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  path_pages,
  path_public,
  path_ui,
  startNextDev,
  watchRootModulePages,
  watchRootModulePublicAssets
} from "@somod/sdk-lib";
import { Command } from "commander";
import { BuildAction } from "./build";
import { PrepareAction } from "./prepare";

export const DevAction = async ({ verbose }: CommonOptions): Promise<void> => {
  const dir = process.cwd();

  await BuildAction({ verbose });

  await PrepareAction({ verbose });

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
    startNextDev,
    verbose,
    dir
  );
};

const devCommand = new Command("dev");

devCommand.action(DevAction);

export default devCommand;
