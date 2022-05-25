import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { path_lib } from "../../utils/constants";

export const lib = async (dir: string): Promise<void> => {
  const libIndex = "index.ts";
  const libIndexPath = join(dir, path_lib, libIndex);

  const pageContent = `export const Welcome = (): string => {
  return "This is a awesome package library, learn more at https://gitlab.com/sodaru/somod/sdk";
};`;

  if (!existsSync(libIndexPath)) {
    const libDir = dirname(libIndexPath);
    await mkdir(libDir, { recursive: true });
    await writeFile(libIndexPath, pageContent);
  }
};
