import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { path_lib } from "../../utils/constants";

export const lib = async (dir: string): Promise<void> => {
  const libIndex = "index.ts";
  const libIndexPath = join(dir, path_lib, libIndex);

  const pageContent = `export const Welcome = (): string => {
  return "Welcome to Sodaru Module Platform. learn more at https://sodaru.com/platform";
};`;

  if (!existsSync(libIndexPath)) {
    const libDir = dirname(libIndexPath);
    await mkdir(libDir, { recursive: true });
    await writeFile(libIndexPath, pageContent);
  }
};
