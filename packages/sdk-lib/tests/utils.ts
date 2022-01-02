import { readJsonFileStore } from "@sodaru/cli-base";
import { copyFile, mkdir } from "fs/promises";
import { dirname, join } from "path";

export * from "@sodev/test-utils";
export const copyCommonLib = async (
  dir: string,
  type: "common" | "njp" | "slp"
): Promise<string> => {
  const libTaget = join(
    dir,
    "node_modules",
    `@somod/${type}-lib`,
    "package.json"
  );
  const libTagetDir = dirname(libTaget);
  await mkdir(libTagetDir, { recursive: true });
  const libSrc = join(__dirname, `../../${type}-lib/package.json`);
  await copyFile(libSrc, libTaget);
  return (await readJsonFileStore(libSrc)).version as string;
};
