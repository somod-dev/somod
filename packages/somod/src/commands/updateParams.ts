import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  file_parametersJson,
  findRootDir,
  updateParametersFromSAM
} from "@somod/sdk-lib";
import { Command, Option } from "commander";

type UpdateParamsOptions = CommonOptions & {
  stackName?: string;
};

export const UpdateParamsAction = async ({
  verbose,
  stackName
}: UpdateParamsOptions): Promise<void> => {
  const dir = findRootDir();

  await taskRunner(
    `Updating /${file_parametersJson}`,
    updateParametersFromSAM,
    verbose,
    dir,
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
