import { key_jsnextMain } from "../../utils/constants";
import readPackageJson, { packageJsonPath } from "../../utils/readPackageJson";

export const doesJsnextMainNotSet = async (dir: string): Promise<void> => {
  const packageJson = await readPackageJson(dir);

  if (packageJson[key_jsnextMain] !== undefined) {
    throw new Error(
      `${key_jsnextMain} must not be set in ${packageJsonPath(dir)}`
    );
  }
};
