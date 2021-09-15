import { key_slp } from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";

export const doesSlpIsTrue = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);

  if (packageJson[key_slp] !== true) {
    throw new Error(`${key_slp} must be true in ${packageJsonPath(dir)}`);
  }
};
