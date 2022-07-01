import { rootCommand } from "@solib/cli-base";
import buildCommand from "./commands/build";
import devCommand from "./commands/dev";
import initCommand from "./commands/init";
import prepareCommand from "./commands/prepare";

const program = rootCommand("njp", [
  initCommand,
  buildCommand,
  prepareCommand,
  devCommand
]);

export default program;
