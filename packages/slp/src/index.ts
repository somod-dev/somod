import { rootCommand } from "@sodaru-cli/base";
import buildCommand from "./commands/build";
import deployCommand from "./commands/deploy";
import initCommand from "./commands/init";

const program = rootCommand("slp", [initCommand, buildCommand, deployCommand]);

export default program;
