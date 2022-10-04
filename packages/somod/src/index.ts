import { rootCommand } from "nodejs-cli-runner";
import buildCommand from "./commands/build";
import deployCommand from "./commands/deploy";
import prepareCommand from "./commands/prepare";
import startCommand from "./commands/start";
import updateParamsCommand from "./commands/updateParams";

const program = rootCommand("somod", [
  buildCommand,
  prepareCommand,
  deployCommand,
  startCommand,
  updateParamsCommand
]);

export default program;
