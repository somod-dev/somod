import { rootCommand } from "@sodaru/cli-base";
import buildCommand from "./commands/build";
import serveCommand from "./commands/serve";
import initCommand from "./commands/init";
import setNjpCommand from "./commands/setNjp";

const program = rootCommand("njp", [
  initCommand,
  buildCommand,
  serveCommand,
  setNjpCommand
]);

export default program;
