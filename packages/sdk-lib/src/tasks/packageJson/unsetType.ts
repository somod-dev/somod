import { key_type } from "../../utils/constants";
import { read, update } from "../../utils/packageJson";

export const unsetType = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  if (Object.keys(packageJson).includes(key_type)) {
    delete packageJson[key_type];
  }
  update(dir, packageJson);
};
