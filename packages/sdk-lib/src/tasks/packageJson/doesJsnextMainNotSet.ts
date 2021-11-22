import { key_jsnextMain } from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";

export const doesJsnextMainNotSet = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);

  if (packageJson[key_jsnextMain] !== undefined) {
    throw new Error(
      `${key_jsnextMain} must not be set in ${packageJsonPath(dir)}`
    );
  }
};
