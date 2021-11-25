import { rootCommand } from "@sodaru/cli-base";
import buildCommand from "./commands/build";

const program = rootCommand("serverless-schema", [buildCommand]);

export default program;
