import { key_commonjs, key_type } from "../../utils/constants";
import { read, update } from "../../utils/packageJson";

export const setTypeToCommonjs = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  packageJson[key_type] = key_commonjs;
  update(dir, packageJson);
};
