import { isArray } from "lodash";
import {
  key_eslintConfig,
  key_eslintConfigExtends,
  key_eslintConfigValue
} from "../../utils/constants";
import readPackageJson, { packageJsonPath } from "../../utils/readPackageJson";

export const isValidEslintConfig = async (dir: string): Promise<void> => {
  const packageJson = await readPackageJson(dir);

  if (
    !packageJson[key_eslintConfig] ||
    !isArray(packageJson[key_eslintConfig][key_eslintConfigExtends]) ||
    packageJson[key_eslintConfig][key_eslintConfigExtends][0] !=
      key_eslintConfigValue
  ) {
    throw new Error(
      `${key_eslintConfig}.${key_eslintConfigExtends}[0] must be '${key_eslintConfigValue}' in ${packageJsonPath(
        dir
      )}`
    );
  }
};
