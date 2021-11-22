import {
  key_prettierConfig,
  key_prettierConfigValue
} from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";

export const isValidPrettierConfig = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);

  if (packageJson[key_prettierConfig] != key_prettierConfigValue) {
    throw new Error(
      `${key_prettierConfig} must be '${key_prettierConfigValue}' in ${packageJsonPath(
        dir
      )}`
    );
  }
};
