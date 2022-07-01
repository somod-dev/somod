import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  file_parametersJson,
  file_samConfig,
  file_templateYaml,
  generateRootParameters,
  generateSAMConfigToml,
  generateSAMTemplate,
  key_slp,
  samCommand
} from "@somod/sdk-lib";
import { Command } from "commander";

export const PrepareAction = async ({
  verbose
}: CommonOptions): Promise<void> => {
  const dir = process.cwd();

  await Promise.all([
    taskRunner(
      `Generate /${file_templateYaml}`,
      generateSAMTemplate,
      verbose,
      dir,
      [key_slp]
    ),

    taskRunner(
      `Create/Update /${file_parametersJson}`,
      generateRootParameters,
      verbose,
      dir,
      [key_slp]
    )
  ]);

  await taskRunner(
    `Validate /${file_templateYaml}`,
    samCommand,
    verbose,
    dir,
    "validate"
  );

  await taskRunner(
    `Build /${file_templateYaml}`,
    samCommand,
    verbose,
    dir,
    "build"
  );

  await taskRunner(
    `Gernerate /${file_samConfig}`,
    generateSAMConfigToml,
    verbose,
    dir,
    [key_slp]
  );
};

const prepareCommand = new Command("prepare");

prepareCommand.action(PrepareAction);

export default prepareCommand;
