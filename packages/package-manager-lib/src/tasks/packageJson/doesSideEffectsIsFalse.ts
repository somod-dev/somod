import { key_sideEffects } from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";

export const doesSideEffectsIsFalse = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);

  if (packageJson[key_sideEffects] !== false) {
    throw new Error(
      `${key_sideEffects} must be false in ${packageJsonPath(dir)}`
    );
  }
};
