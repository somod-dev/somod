import { rootCommand } from "@sodaru-cli/base";
import buildCommand from "./commands/build";
import devCommand from "./commands/dev";
import initCommand from "./commands/init";

const program = rootCommand("njp", [initCommand, buildCommand, devCommand]);

export default program;
