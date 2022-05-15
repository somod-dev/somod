import { rootCommand } from "@solib/cli-base";
import buildCommand from "./commands/build";
import serveCommand from "./commands/serve";
import initCommand from "./commands/init";
import deployCommand from "./commands/deploy";

const program = rootCommand("njp", [
  initCommand,
  buildCommand,
  serveCommand,
  deployCommand
]);

export default program;
