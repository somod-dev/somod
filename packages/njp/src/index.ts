import { Command } from "commander";
import initCommand from "./commands/init";
import buildCommand from "./commands/build";
import devCommand from "./commands/dev";

const program = new Command("njp");

program.addCommand(initCommand);
program.addCommand(buildCommand);
program.addCommand(devCommand);

const errorColor = (str: string) => {
  // Add ANSI escape codes to display text in red.
  return `\x1b[31m${str}\x1b[0m`;
};

const successColor = (str: string) => {
  // Add ANSI escape codes to display text in red.
  return `\x1b[32m${str}\x1b[0m`;
};

const handleError = (e: Error): void => {
  // eslint-disable-next-line no-console
  console.log(errorColor("COMMAND FAILED"));
  // eslint-disable-next-line no-console
  console.log("");
  // eslint-disable-next-line no-console
  console.error(errorColor(e.message));
  process.exit(1);
};

try {
  program
    .parseAsync()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log(successColor("DONE"));
    })
    .catch(handleError);
} catch (e) {
  handleError(e);
}

export default program;
