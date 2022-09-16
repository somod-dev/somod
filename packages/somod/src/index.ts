import { rootCommand } from "nodejs-cli-runner";
import buildCommand from "./commands/build";
import deployCommand from "./commands/deploy";
import prepareCommand from "./commands/prepare";
import serveCommand from "./commands/serve";
import updateParamsCommand from "./commands/updateParams";

const program = rootCommand("somod", [
  buildCommand,
  prepareCommand,
  deployCommand,
  serveCommand,
  updateParamsCommand
]);

export default program;
