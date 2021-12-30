import { key_somod } from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";

export const doesSomodIsTrue = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);

  if (packageJson[key_somod] !== true) {
    throw new Error(`${key_somod} must be true in ${packageJsonPath(dir)}`);
  }
};
