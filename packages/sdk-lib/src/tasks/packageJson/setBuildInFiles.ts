import { key_files, path_build } from "../../utils/constants";
import { read, update } from "../../utils/packageJson";

export const setBuildInFiles = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  if (!packageJson[key_files]) {
    packageJson[key_files] = [];
  }

  if (!(packageJson[key_files] as string[]).includes(path_build)) {
    (packageJson[key_files] as string[]).push(path_build);
  }

  update(dir, packageJson);
};
