import { existsSync } from "fs";
import { packageJsonPath } from "../../utils/readPackageJson";

export const exists = async (dir: string): Promise<void> => {
  const _packageJsonPath = packageJsonPath(dir);
  const _exists = existsSync(_packageJsonPath);
  if (!_exists) {
    throw new Error(`${_packageJsonPath} does not exist`);
  }
};
