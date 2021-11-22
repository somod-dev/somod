import { isArray, isPlainObject } from "lodash";
import {
  key_eslintConfig,
  key_eslintConfigExtends,
  key_eslintConfigValue
} from "../../utils/constants";
import { read, update } from "../../utils/packageJson";

export const setEslintConfig = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  if (!isPlainObject(packageJson[key_eslintConfig])) {
    packageJson[key_eslintConfig] = {};
  }

  if (!isArray(packageJson[key_eslintConfig][key_eslintConfigExtends])) {
    packageJson[key_eslintConfig][key_eslintConfigExtends] = [];
  }

  if (
    packageJson[key_eslintConfig][key_eslintConfigExtends][0] !=
    key_eslintConfigValue
  ) {
    (
      packageJson[key_eslintConfig][key_eslintConfigExtends] as string[]
    ).unshift(key_eslintConfigValue);
  }

  update(dir, packageJson);
};
