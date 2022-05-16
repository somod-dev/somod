import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  file_templateYaml,
  generateSAMTemplate,
  key_somod,
  key_slp,
  samCommand
} from "@somod/sdk-lib";
import { Command, Option } from "commander";
import { BuildAction } from "./build";

type DeployOptions = CommonOptions & {
  stage: "all" | "prepare" | "apply";
  guided: boolean;
};

export const DeployServerlessAction = async ({
  verbose,
  stage,
  guided
}: DeployOptions): Promise<void> => {
  const dir = process.cwd();

  if (stage == "all" || stage == "prepare") {
    await BuildAction({ verbose, type: "slp" });

    await taskRunner(
      `Generating ${file_templateYaml}`,
      generateSAMTemplate,
      verbose,
      dir,
      [key_somod, key_slp]
    );

    await taskRunner(
      `Validating ${file_templateYaml}`,
      samCommand,
      verbose,
      dir,
      "validate"
    );
  }

  if (stage == "all" || stage == "apply") {
    await taskRunner(
      `Building ${file_templateYaml}`,
      samCommand,
      verbose,
      dir,
      "build"
    );

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

const deployServerlessCommand = new Command("deploy-serverless");

deployServerlessCommand.action(DeployServerlessAction);

deployServerlessCommand.addOption(
  new Option("-s, --stage [stage]", "Deployment stages to execute")
    .choices(["all", "prepare", "apply"])
    .default("all")
);

deployServerlessCommand.addOption(
  new Option(
    "-g, --guided",
    "guided will assist in configuring backend parameters in apply state"
  )
);

export default deployServerlessCommand;
