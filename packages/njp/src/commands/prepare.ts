import { CommonOptions, taskRunner } from "@solib/cli-base";
import {
  createPages,
  createPublicAssets,
  file_dotenv,
  file_nextConfigJs,
  file_parametersJson,
  findRootDir,
  generateNextConfig,
  generateRootParameters,
  key_njp,
  path_pages,
  path_public
} from "@somod/sdk-lib";
import { Command } from "commander";

export const PrepareAction = async ({
  verbose
}: CommonOptions): Promise<void> => {
  const dir = findRootDir();

  await Promise.all([
    taskRunner(`Create /${path_pages}`, createPages, verbose, dir, [key_njp]),
    taskRunner(`Create /${path_public}`, createPublicAssets, verbose, dir, [
      key_njp
    ]),

    taskRunner(
      `Create/Update /${file_parametersJson}`,
      generateRootParameters,
      verbose,
      dir,
      [key_njp]
    )
  ]);

  await taskRunner(
    `Gernerate /${file_nextConfigJs} and /${file_dotenv}`,
    generateNextConfig,
    verbose,
    dir,
    [key_njp]
  );
};

const prepareCommand = new Command("prepare");

prepareCommand.action(PrepareAction);

export default prepareCommand;
