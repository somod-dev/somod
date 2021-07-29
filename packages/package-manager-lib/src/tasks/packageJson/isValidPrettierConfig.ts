import {
  key_prettierConfig,
  key_prettierConfigValue
} from "../../utils/constants";
import readPackageJson, { packageJsonPath } from "../../utils/readPackageJson";

export const isValidPrettierConfig = async (dir: string): Promise<void> => {
  const packageJson = await readPackageJson(dir);

  if (packageJson[key_prettierConfig] != key_prettierConfigValue) {
    throw new Error(
      `${key_prettierConfig} must be '${key_prettierConfigValue}' in ${packageJsonPath(
        dir
      )}`
    );
  }
};
