import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  createPages,
  createPublicAssets,
  file_dotenv,
  file_nextConfigJs,
  file_parametersJson,
  file_samConfig,
  file_templateYaml,
  findRootDir,
  generateNextConfig,
  generateRootParameters,
  generateSAMConfigToml,
  generateSAMTemplate,
  key_njp,
  key_slp,
  key_somod,
  path_pages,
  path_public,
  samCommand
} from "@somod/sdk-lib";
import { Command } from "commander";

export const PrepareAction = async ({
  verbose
}: CommonOptions): Promise<void> => {
  const dir = findRootDir();

  await Promise.all([
    taskRunner(`Create /${path_pages}`, createPages, verbose, dir, [
      key_somod,
      key_njp,
      key_slp
    ]),
    taskRunner(`Create /${path_public}`, createPublicAssets, verbose, dir, [
      key_somod,
      key_njp,
      key_slp
    ]),

    taskRunner(
      `Generate /${file_templateYaml}`,
      generateSAMTemplate,
      verbose,
      dir,
      [key_somod, key_njp, key_slp]
    ),

    taskRunner(
      `Create/Update /${file_parametersJson}`,
      generateRootParameters,
      verbose,
      dir,
      [key_somod, key_njp, key_slp]
    )
  ]);

  await taskRunner(
    `Gernerate /${file_nextConfigJs} and /${file_dotenv}`,
    generateNextConfig,
    verbose,
    dir,
    [key_somod, key_njp, key_slp]
  );

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
    [key_somod, key_njp, key_slp]
  );
};

const prepareCommand = new Command("prepare");

prepareCommand.action(PrepareAction);

export default prepareCommand;
