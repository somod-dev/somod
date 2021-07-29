import { key_njp } from "../../utils/constants";
import readPackageJson, { packageJsonPath } from "../../utils/readPackageJson";

export const doesNjpIsTrue = async (dir: string): Promise<void> => {
  const packageJson = await readPackageJson(dir);

  if (packageJson[key_njp] !== true) {
    throw new Error(`${key_njp} must be true in ${packageJsonPath(dir)}`);
  }
};
