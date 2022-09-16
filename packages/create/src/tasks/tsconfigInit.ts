import { writeFile } from "fs/promises";
import { join } from "path";
import { CompilerOptions } from "typescript";

export const tsconfigInit = async (
  dir: string,
  config: {
    compilerOptions?: CompilerOptions;
    include?: string[];
    exclude?: string[];
  }
) => {
  await writeFile(
    join(dir, "tsconfig.somod.json"),
    JSON.stringify(config, null, 2)
  );
};
