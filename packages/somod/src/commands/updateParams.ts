import { CommonOptions, taskRunner, Command, Option } from "nodejs-cli-runner";
import {
  file_parametersJson,
  findRootDir,
  initializeContext,
  updateParametersFromSAM
} from "somod-lib";

type UpdateParamsOptions = CommonOptions & {
  stackName?: string;
};

export const UpdateParamsAction = async ({
  verbose,
  stackName
}: UpdateParamsOptions): Promise<void> => {
  const dir = findRootDir();

  const context = await taskRunner(
    `Initialize Context`,
    initializeContext,
    {
      verbose,
      progressIndicator: true
    },
    dir,
    false,
    true
  );

  await taskRunner(
    `Updating /${file_parametersJson}`,
    updateParametersFromSAM,
    { verbose, progressIndicator: true },
    context,
    stackName
  );
};

const updateParamsCommand = new Command("update-params");

updateParamsCommand.action(UpdateParamsAction);

updateParamsCommand.addOption(
  new Option(
    "-s, --stack-name <name>",
    "Stack name to update the params from. Reads from samconfig.toml if omitted"
  )
);

export default updateParamsCommand;
