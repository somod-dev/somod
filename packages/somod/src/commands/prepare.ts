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
  path_public
} from "@somod/sdk-lib";
import { Command } from "commander";

type PrepareOptions = CommonOptions & {
  ui: boolean;
  serverless: boolean;
};

export const PrepareAction = async ({
  verbose,
  ui,
  serverless
}: PrepareOptions): Promise<void> => {
  const dir = findRootDir();

  const prepareUi = !serverless || ui;
  const prepareServerless = !ui || serverless;

  if (prepareUi) {
    await taskRunner(`Create /${path_pages}`, createPages, verbose, dir, [
      key_somod,
      key_njp,
      key_slp
    ]);
    await taskRunner(
      `Create /${path_public}`,
      createPublicAssets,
      verbose,
      dir,
      [key_somod, key_njp, key_slp]
    );
  }
  if (prepareServerless) {
    await taskRunner(
      `Generate /${file_templateYaml}`,
      generateSAMTemplate,
      verbose,
      dir,
      [key_somod, key_njp, key_slp]
    );
  }
  await taskRunner(
    `Create/Update /${file_parametersJson}`,
    generateRootParameters,
    verbose,
    dir,
    [key_somod, key_njp, key_slp]
  );

  if (prepareUi) {
    await taskRunner(
      `Gernerate /${file_nextConfigJs} and /${file_dotenv}`,
      generateNextConfig,
      verbose,
      dir,
      [key_somod, key_njp, key_slp]
    );
  }

  if (prepareServerless) {
    await taskRunner(
      `Gernerate /${file_samConfig}`,
      generateSAMConfigToml,
      verbose,
      dir,
      [key_somod, key_njp, key_slp]
    );
  }
};

const prepareCommand = new Command("prepare");

prepareCommand.action(PrepareAction);

prepareCommand.option("--ui", "prepare only ui");
prepareCommand.option("--serverless", "prepare only serverless");

export default prepareCommand;
