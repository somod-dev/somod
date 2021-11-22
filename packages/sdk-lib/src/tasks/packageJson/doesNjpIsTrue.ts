import { key_njp } from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";

export const doesNjpIsTrue = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);

  if (packageJson[key_njp] !== true) {
    throw new Error(`${key_njp} must be true in ${packageJsonPath(dir)}`);
  }
};
