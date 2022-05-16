import { rootCommand } from "@solib/cli-base";
import buildCommand from "./commands/build";
import serveCommand from "./commands/serve";
import initCommand from "./commands/init";

const program = rootCommand("njp", [initCommand, buildCommand, serveCommand]);

export default program;
