import { rootCommand } from "@sodaru-cli/base";
import buildCommand from "./commands/build";
import initCommand from "./commands/init";

const program = rootCommand("slp", [initCommand, buildCommand]);

export default program;
