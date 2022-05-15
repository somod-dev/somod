import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  buildNextJs,
  createNextJsDeployment,
  deleteNjpWorkingDir,
  path_njp_deployment,
  path_njp_working_dir,
  vercelCommand
} from "@somod/sdk-lib";
import { Command, Option } from "commander";
import { join } from "path";
import { ServeAction } from "./serve";

type DeployOptions = CommonOptions & {
  stage: "all" | "prepare" | "apply";
};

export const DeployAction = async (
  vercelArgs: string[],
  { stage, verbose }: DeployOptions
): Promise<void> => {
  const dir = process.cwd();

  if (stage == "all" || stage == "prepare") {
    await ServeAction({ verbose, stage: "prepare" });

    await taskRunner(`Run next build`, buildNextJs, verbose, dir);

    await taskRunner(
      `Delete ${path_njp_working_dir} directory`,
      deleteNjpWorkingDir,
      verbose,
      dir
    );

    await taskRunner(
      `Create NextJs Deployment`,
      createNextJsDeployment,
      verbose,
      dir
    );
  }

  if (stage == "all" || stage == "apply") {
    await taskRunner(
      `Deploy to Vercel`,
      vercelCommand,
      verbose,
      join(dir, path_njp_working_dir, path_njp_deployment),
      vercelArgs
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

deployCommand.argument("[vercelArgs...]", "arguments for vercel command");

export default deployCommand;
