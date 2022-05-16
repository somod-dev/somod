import { rootCommand } from "@solib/cli-base";
import buildCommand from "./commands/build";
import deployServerlessCommand from "./commands/deployServerless";
import initCommand from "./commands/init";
import serveCommand from "./commands/serve";

const program = rootCommand("emp", [
  initCommand,
  buildCommand,
  serveCommand,
  deployServerlessCommand
]);

export default program;
