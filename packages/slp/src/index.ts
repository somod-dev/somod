import { rootCommand } from "@sodaru/cli-base";
import buildCommand from "./commands/build";
import deployCommand from "./commands/deploy";
import initCommand from "./commands/init";
import setSlpCommand from "./commands/setSlp";

const program = rootCommand("slp", [
  initCommand,
  buildCommand,
  deployCommand,
  setSlpCommand
]);

export default program;
