import {
  CommonOptions,
  createPages,
  createPublicAssets,
  createRootModulePages,
  createRootModulePublicAssets,
  key_njp,
  path_pages,
  path_public,
  path_ui,
  startNextDev,
  taskRunner,
  validateModuleDependency,
  watchRootModulePages,
  watchRootModulePublicAssets
} from "@sodaru/package-manager-lib";
import { Command } from "commander";
import { BuildAction } from "./build";

export const DevAction = async ({ verbose }: CommonOptions): Promise<void> => {
  const dir = process.cwd();

  await BuildAction({ verbose });

  await taskRunner(
    `Validate module dependency`,
    validateModuleDependency,
    verbose,
    dir,
    [key_njp]
  );
  await Promise.all([
    taskRunner(`Create ${path_pages}`, createPages, verbose, dir, [key_njp]),
    taskRunner(`Create ${path_public}`, createPublicAssets, verbose, dir, [
      key_njp
    ])
  ]);

  await Promise.all([
    taskRunner(
      `Update ${path_pages} with ${path_ui}/${path_pages}`,
      createRootModulePages,
      verbose,
      dir
    ),
    taskRunner(
      `Update ${path_public} with ${path_ui}/${path_public}`,
      createRootModulePublicAssets,
      verbose,
      dir
    )
  ]);

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
