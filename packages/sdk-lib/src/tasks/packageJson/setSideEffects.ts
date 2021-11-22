import { key_sideEffects } from "../../utils/constants";
import { read, update } from "../../utils/packageJson";

export const setSideEffects = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  packageJson[key_sideEffects] = false;
  update(dir, packageJson);
};
