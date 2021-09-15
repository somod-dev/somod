import { key_slp } from "../../utils/constants";
import { read, update } from "../../utils/packageJson";

export const setSlp = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  packageJson[key_slp] = true;
  update(dir, packageJson);
};
