import { Command } from "commander";
import initCommand from "./commands/init";
import buildCommand from "./commands/build";
import devCommand from "./commands/dev";
import { logError, logSuccess } from "./output";

const program = new Command("njp");

program.addCommand(initCommand);
program.addCommand(buildCommand);
program.addCommand(devCommand);

const handleError = (e: Error): void => {
  logError(e?.message);
  process.exit(1);
};

try {
  program
    .parseAsync()
    .then(() => {
      logSuccess("DONE");
    })
    .catch(handleError);
} catch (e) {
  handleError(e);
}

export default program;
