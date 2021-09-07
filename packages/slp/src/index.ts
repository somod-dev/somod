import { rootCommand } from "@sodaru-cli/base";
import initCommand from "./commands/init";

const program = rootCommand("slp", [initCommand]);

export default program;
