import { CommonOptions, taskRunner } from "@sodaru/cli-base";
import { file_packageJson, key_njp, setNjpInPackageJson } from "@somod/sdk-lib";
import { Command } from "commander";

export const SetNjpAction = async ({
  verbose
}: CommonOptions): Promise<void> => {
  const dir = process.cwd();
  await taskRunner(
    `Set ${key_njp} in ${file_packageJson}`,
    setNjpInPackageJson,
    verbose,
    dir
  );
};

const setNjpCommand = new Command("set-njp");

setNjpCommand.action(SetNjpAction);

export default setNjpCommand;
