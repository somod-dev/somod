import { key_module, key_type } from "../../utils/constants";
import readPackageJson, { packageJsonPath } from "../../utils/readPackageJson";

export const doesTypeIsModule = async (dir: string): Promise<void> => {
  const packageJson = await readPackageJson(dir);

  if (packageJson[key_type] != key_module) {
    throw new Error(
      `${key_type} must be '${key_module}' in ${packageJsonPath(dir)}`
    );
  }
};
