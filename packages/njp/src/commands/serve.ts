import { CommonOptions, taskRunner } from "@sodaru-cli/base";
import {
  createPages,
  createPublicAssets,
  createRootModulePages,
  createRootModulePublicAssets,
  key_njp,
  path_pages,
  path_public,
  path_ui,
  startNextDev,
  validateModuleDependency,
  watchRootModulePages,
  watchRootModulePublicAssets
} from "@sodaru-cli/package-manager-lib";
import { Command, Option } from "commander";
import { BuildAction } from "./build";

type ServeOptions = CommonOptions & {
  stage: "all" | "prepare" | "start-dev";
};

export const ServeAction = async ({
  verbose,
  stage
}: ServeOptions): Promise<void> => {
  const dir = process.cwd();

  if (stage == "all" || stage == "prepare") {
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
  }

  if (stage == "all" || stage == "start-dev") {
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
  }
};

const serveCommand = new Command("dev");

serveCommand.action(ServeAction);

serveCommand.addOption(
  new Option("-s, --stage [stage]", "Serve stages to execute")
    .choices(["all", "prepare", "start-dev"])
    .default("all")
);

export default serveCommand;