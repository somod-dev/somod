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
  path_pages,
  path_public
} from "@somod/sdk-lib";
import { Command } from "commander";
import {
  addSOMODCommandTypeOptions,
  getSOMODCommandTypeOptions,
  SOMODCommandTypeOptions
} from "../utils/common";

type PrepareOptions = CommonOptions & SOMODCommandTypeOptions;

export const PrepareAction = async ({
  verbose,
  ...options
}: PrepareOptions): Promise<void> => {
  const dir = findRootDir();

  const { ui, serverless } = getSOMODCommandTypeOptions(options);

  if (ui) {
    await taskRunner(`Create /${path_pages}`, createPages, verbose, dir);
    await taskRunner(
      `Create /${path_public}`,
      createPublicAssets,
      verbose,
      dir
    );
  }
  if (serverless) {
    await taskRunner(
      `Generate /${file_templateYaml}`,
      generateSAMTemplate,
      verbose,
      dir
    );
  }
  await taskRunner(
    `Create/Update /${file_parametersJson}`,
    generateRootParameters,
    verbose,
    dir
  );

  if (ui) {
    await taskRunner(
      `Gernerate /${file_nextConfigJs} and /${file_dotenv}`,
      generateNextConfig,
      verbose,
      dir
    );
  }

  if (serverless) {
    await taskRunner(
      `Gernerate /${file_samConfig}`,
      generateSAMConfigToml,
      verbose,
      dir
    );
  }
};

const prepareCommand = new Command("prepare");

prepareCommand.action(PrepareAction);
addSOMODCommandTypeOptions(prepareCommand);

export default prepareCommand;
