import { Command } from "commander";
import { logError, logSuccess } from "./output";

export type CommonOptions = {
  verbose: boolean;
};

const addCommonOptions = (command: Command): void => {
  command.option("-v, --verbose", "enable verbose");
};

export const rootCommand = (name: string, subCommands: Command[]): Command => {
  const command = new Command(name);

  subCommands.forEach(subCommand => {
    addCommonOptions(subCommand);
    command.addCommand(subCommand);
  });

  const handleError = (e: Error): void => {
    logError(e?.message);
    process.exit(1);
  };

  try {
    command
      .parseAsync()
      .then(() => {
        logSuccess("DONE");
      })
      .catch(handleError);
  } catch (e) {
    handleError(e);
  }

  return command;
};
