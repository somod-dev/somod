import { CommonOptions, taskRunner } from "@sodaru/cli-base";
import {
  file_packageJson,
  key_somod,
  setSomodInPackageJson
} from "@somod/sdk-lib";
import { Command } from "commander";

export const SetSomodAction = async ({
  verbose
}: CommonOptions): Promise<void> => {
  const dir = process.cwd();
  await taskRunner(
    `Set ${key_somod} in ${file_packageJson}`,
    setSomodInPackageJson,
    verbose,
    dir
  );
};

const setSomodCommand = new Command("set-somod");

setSomodCommand.action(SetSomodAction);

export default setSomodCommand;
