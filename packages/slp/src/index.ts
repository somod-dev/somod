import { rootCommand } from "@solib/cli-base";
import buildCommand from "./commands/build";
import deployCommand from "./commands/deploy";
import initCommand from "./commands/init";
import prepareCommand from "./commands/prepare";

const program = rootCommand("slp", [
  initCommand,
  buildCommand,
  prepareCommand,
  deployCommand
]);

export default program;
