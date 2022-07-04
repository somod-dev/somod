import { rootCommand } from "@solib/cli-base";
import buildCommand from "./commands/build";
import serveCommand from "./commands/serve";
import initCommand from "./commands/init";
import prepareCommand from "./commands/prepare";

const program = rootCommand("njp", [
  initCommand,
  buildCommand,
  prepareCommand,
  serveCommand
]);

export default program;
