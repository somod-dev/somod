import { key_somod } from "../../utils/constants";
import { read, update } from "../../utils/packageJson";

export const setSomod = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  packageJson[key_somod] = true;
  update(dir, packageJson);
};
