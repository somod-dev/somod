import { rootCommand } from "@solib/cli-base";
import buildCommand from "./commands/build";
import deployCommand from "./commands/deploy";
import initCommand from "./commands/init";
import prepareCommand from "./commands/prepare";
import serveCommand from "./commands/serve";
import updateParamsCommand from "./commands/updateParams";

const program = rootCommand("somod", [
  initCommand,
  buildCommand,
  prepareCommand,
  deployCommand,
  serveCommand,
  updateParamsCommand
]);

export default program;
