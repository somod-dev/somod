import { key_type } from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";

export const doesTypeIsNotSet = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);

  if (packageJson[key_type] !== undefined) {
    throw new Error(`${key_type} must not be set in ${packageJsonPath(dir)}`);
  }
};
