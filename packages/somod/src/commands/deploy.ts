import { CommonOptions, taskRunner, Command, Option } from "nodejs-cli-runner";
import { file_templateYaml, findRootDir, samDeploy } from "somod-lib";
import { addDebugOptions, DebugModeOptions } from "../utils/common";
import { BuildAction } from "./build";
import { PrepareAction } from "./prepare";

type DeployOptions = CommonOptions &
  DebugModeOptions & {
    guided: boolean;
  };

export const DeployAction = async ({
  verbose,
  guided,
  debug
}: DeployOptions): Promise<void> => {
  const dir = findRootDir();

  await BuildAction({ verbose, ui: false, serverless: true, debug });

  await PrepareAction({ verbose, ui: false, serverless: true, debug });

  await taskRunner(
    `Deploying ${file_templateYaml}`,
    samDeploy,
    { verbose, progressIndicator: false },
    dir,
    verbose,
    guided
  );
};

const deployCommand = new Command("deploy");

deployCommand.action(DeployAction);

deployCommand.addOption(
  new Option(
    "-g, --guided",
    "guided will assist in configuring backend parameters in apply state"
  )
);
addDebugOptions(deployCommand);

export default deployCommand;
