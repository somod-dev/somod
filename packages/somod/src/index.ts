import { rootCommand } from "@sodaru/cli-base";
import buildCommand from "./commands/build";
import deployCommand from "./commands/deploy";
import initCommand from "./commands/init";
import serveCommand from "./commands/serve";
import setSomodCommand from "./commands/setSomod";

const program = rootCommand("emp", [
  initCommand,
  buildCommand,
  serveCommand,
  deployCommand,
  setSomodCommand
]);

export default program;
