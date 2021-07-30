import { key_jsnextMain } from "../../utils/constants";
import { read, update } from "../../utils/packageJson";

export const unsetJsnextMain = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  if (Object.keys(packageJson).includes(key_jsnextMain)) {
    delete packageJson[key_jsnextMain];
  }
  update(dir, packageJson);
};
