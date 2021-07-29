import { key_sideEffects } from "../../utils/constants";
import readPackageJson, { packageJsonPath } from "../../utils/readPackageJson";

export const doesSideEffectsIsFalse = async (dir: string): Promise<void> => {
  const packageJson = await readPackageJson(dir);

  if (packageJson[key_sideEffects] !== false) {
    throw new Error(
      `${key_sideEffects} must be false in ${packageJsonPath(dir)}`
    );
  }
};
