import { rootCommand } from "@sodaru/cli-base";
import buildCommand from "./commands/build";
import deployNextJsCommand from "./commands/deployNextJs";
import deployServerlessCommand from "./commands/deployServerless";
import initCommand from "./commands/init";
import serveCommand from "./commands/serve";

const program = rootCommand("emp", [
  initCommand,
  buildCommand,
  serveCommand,
  deployServerlessCommand,
  deployNextJsCommand
]);

export default program;
