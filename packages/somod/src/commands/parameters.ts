import { CommonOptions, taskRunner, Command, Option } from "nodejs-cli-runner";
import {
  file_parametersJson,
  findRootDir,
  initializeContext,
  updateParametersFromSAM,
  validateParameterValues
} from "somod-lib";
import { addDebugOptions, DebugModeOptions } from "../utils/common";

type UpdateParamsOptions = CommonOptions &
  DebugModeOptions & {
    stackName?: string;
  };

type ValidateParamsOptions = CommonOptions & DebugModeOptions;

export const UpdateParamsAction = async ({
  verbose,
  debug,
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
    true,
    debug
  );

  await taskRunner(
    `Updating /${file_parametersJson}`,
    updateParametersFromSAM,
    { verbose, progressIndicator: true },
    context,
    stackName
  );
};

const updateParamsCommand = new Command("update");

updateParamsCommand.action(UpdateParamsAction);

updateParamsCommand.addOption(
  new Option(
    "-s, --stack-name <name>",
    "Stack name to update the params from. Reads from samconfig.toml if omitted"
  )
);
addDebugOptions(updateParamsCommand);

export const ValidateParamsAction = async ({
  verbose,
  debug
}: ValidateParamsOptions): Promise<void> => {
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
    false,
    debug
  );

  await taskRunner(
    `Validating /${file_parametersJson}`,
    validateParameterValues,
    { verbose, progressIndicator: true },
    context
  );
};

const validateParamsCommand = new Command("validate");

validateParamsCommand.action(ValidateParamsAction);
addDebugOptions(validateParamsCommand);

const parametersCommand = new Command("parameters");
parametersCommand.addCommand(updateParamsCommand);
parametersCommand.addCommand(validateParamsCommand);

export default parametersCommand;
