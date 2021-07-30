import {
  key_prettierConfig,
  key_prettierConfigValue
} from "../../utils/constants";
import { read, update } from "../../utils/packageJson";

export const setPrettierConfig = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  packageJson[key_prettierConfig] = key_prettierConfigValue;
  update(dir, packageJson);
};
