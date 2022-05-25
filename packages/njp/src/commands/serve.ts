import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  createPages,
  createPublicAssets,
  createRootModulePages,
  createRootModulePublicAssets,
  file_dotenv,
  file_eslintIgnore,
  file_nextConfigJs,
  file_njpConfigJson,
  file_npmrc,
  file_packageJson,
  file_packageLockJson,
  file_prettierIgnore,
  file_vercelIgnore,
  key_njp,
  path_lib,
  path_pages,
  path_public,
  path_ui,
  startNextDev,
  updateNjpConfig,
  updateVercelIgnore,
  watchRootModulePages,
  watchRootModulePublicAssets
} from "@somod/sdk-lib";
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
      `update ${file_njpConfigJson} & ${file_dotenv}`,
      updateNjpConfig,
      verbose,
      dir,
      [key_njp]
    );
  }

  if (stage == "prepare") {
    await taskRunner(
      `Initialize ${file_vercelIgnore}`,
      updateVercelIgnore,
      verbose,
      dir,
      [
        "/*",
        `!${path_lib}`,
        `!${path_ui}`,
        `!${path_pages}`,
        `!${path_public}`,
        `!${file_dotenv}`,
        `!${file_npmrc}`,
        `!${file_prettierIgnore}`,
        `!${file_eslintIgnore}`,
        `!${file_njpConfigJson}`,
        `!${file_nextConfigJs}`,
        `!${file_packageLockJson}`,
        `!${file_packageJson}`
      ]
    );
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

const serveCommand = new Command("serve");

serveCommand.action(ServeAction);

serveCommand.addOption(
  new Option("-s, --stage [stage]", "Serve stages to execute")
    .choices(["all", "prepare", "start-dev"])
    .default("all")
);

export default serveCommand;
