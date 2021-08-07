import { rootCommand } from "@sodaru/package-manager-lib";
import buildCommand from "./commands/build";
import devCommand from "./commands/dev";
import initCommand from "./commands/init";

const program = rootCommand("njp", [initCommand, buildCommand, devCommand]);

export default program;
