import { CommonOptions, taskRunner } from "@sodaru/cli-base";
import { Command } from "commander";
import { join } from "path";
import { buildSchemaDir } from "../lib/build";

const buildSchemaDirs = async (
  dir: string,
  schemaDirs: string[]
): Promise<void> => {
  await Promise.all(
    schemaDirs.map(async schemaDir => {
      await buildSchemaDir(join(dir, schemaDir));
    })
  );
};

export const BuildAction = async (
  schemaDirs: string[],
  { verbose }: CommonOptions
): Promise<void> => {
  const dir = process.cwd();
  await taskRunner(
    "Building Schemas",
    buildSchemaDirs,
    verbose,
    dir,
    schemaDirs
  );
};

const buildCommand = new Command("build");

buildCommand.action(BuildAction);

buildCommand.argument("<dirs...>", "Schema directories to build");

export default buildCommand;
