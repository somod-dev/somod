import { CommonOptions, taskRunner } from "@solib/cli-base";
import { file_templateYaml, samCommand } from "@somod/sdk-lib";
import { Command, Option } from "commander";
import { BuildAction } from "./build";
import { PrepareAction } from "./prepare";

type DevOptions = CommonOptions & {
  guided: boolean;
};

export const DevAction = async ({
  verbose,
  guided
}: DevOptions): Promise<void> => {
  const dir = process.cwd();

  await BuildAction({ verbose });

  await PrepareAction({ verbose });

  await taskRunner(
    `Deploying ${file_templateYaml}`,
    samCommand,
    verbose,
    dir,
    "deploy",
    guided
  );
};

const devCommand = new Command("dev");

devCommand.action(DevAction);

devCommand.addOption(
  new Option(
    "-g, --guided",
    "guided will assist in configuring backend parameters in apply state"
  )
);

export default devCommand;
