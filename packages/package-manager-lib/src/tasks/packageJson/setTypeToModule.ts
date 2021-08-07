import { key_module, key_type } from "../../utils/constants";
import { read, update } from "../../utils/packageJson";

export const setTypeToModule = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  packageJson[key_type] = key_module;
  update(dir, packageJson);
};
