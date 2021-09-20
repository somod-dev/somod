import { CommonOptions, taskRunner } from "@sodaru-cli/base";
import {
  bundleServerlessFunctions,
  deleteSlpWorkingDir,
  file_templateYaml,
  generateSAMTemplate,
  key_slp,
  path_lambdas,
  path_slpWorkingDir,
  samCommand
} from "@sodaru-cli/package-manager-lib";
import { Command, Option } from "commander";
import { BuildAction } from "./build";

type DeployOptions = CommonOptions & {
  stage: "all" | "prepare" | "apply";
  guided: boolean;
};

export const DeployAction = async ({
  verbose,
  stage,
  guided
}: DeployOptions): Promise<void> => {
  const dir = process.cwd();

  if (stage == "all" || stage == "prepare") {
    await BuildAction({ verbose });

    await taskRunner(
      `Deleting ${path_slpWorkingDir} directory`,
      deleteSlpWorkingDir,
      verbose,
      dir
    );

    await taskRunner(
      `Generating ${file_templateYaml}`,
      generateSAMTemplate,
      verbose,
      dir,
      [key_slp]
    );

    await taskRunner(
      `Bundling Lambda functions at ${path_slpWorkingDir}/${path_lambdas}`,
      bundleServerlessFunctions,
      verbose,
      dir
    );

    await taskRunner(
      `Validating ${file_templateYaml}`,
      samCommand,
      verbose,
      dir,
      "validate"
    );

    await taskRunner(
      `Building ${file_templateYaml}`,
      samCommand,
      verbose,
      dir,
      "build"
    );
  }

  if (stage == "all" || stage == "apply") {
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

const deployCommand = new Command("deploy");

deployCommand.action(DeployAction);

deployCommand.addOption(
  new Option("-s, --stage [stage]", "Deployment stages to execute")
    .choices(["all", "prepare", "apply"])
    .default("all")
);

deployCommand.addOption(
  new Option(
    "-g, --guided",
    "guided will assist in configuring backend parameters in apply state"
  )
);

export default deployCommand;