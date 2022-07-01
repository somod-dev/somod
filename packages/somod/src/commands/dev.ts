import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  file_templateYaml,
  path_pages,
  path_public,
  path_ui,
  samCommand,
  startNextDev,
  watchRootModulePages,
  watchRootModulePublicAssets
} from "@somod/sdk-lib";
import { Command, Option, Argument } from "commander";
import { BuildAction } from "./build";
import { PrepareAction } from "./prepare";

type DevOptions = CommonOptions & {
  type: "ui" | "serverless";
  guided: boolean;
};

export const DevAction = async ({
  verbose,
  type,
  guided
}: DevOptions): Promise<void> => {
  const dir = process.cwd();

  await BuildAction({ verbose });

  await PrepareAction({ verbose });

  if (type == "ui") {
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
  } else {
    await taskRunner(
      `Deploying ${file_templateYaml}`,
      samCommand,
      verbose,
      dir,
      "deploy",
      guided
    );
  }
};

const devCommand = new Command("dev");

devCommand.action(DevAction);

devCommand.addArgument(new Argument("<type>").choices(["ui", "serverless"]));

devCommand.addOption(
  new Option(
    "-g, --guided",
    "guided will assist in configuring backend parameters in apply state"
  )
);

export default devCommand;
