import { CommonOptions, taskRunner } from "@sodaru/cli-base";
import { file_packageJson, key_slp, setSlpInPackageJson } from "@somod/sdk-lib";
import { Command } from "commander";

export const SetSlpAction = async ({
  verbose
}: CommonOptions): Promise<void> => {
  const dir = process.cwd();
  await taskRunner(
    `Set ${key_slp} in ${file_packageJson}`,
    setSlpInPackageJson,
    verbose,
    dir
  );
};

const setSlpCommand = new Command("set-slp");

setSlpCommand.action(SetSlpAction);

export default setSlpCommand;
