import { getCommandVersion } from "@sodaru/cli-base";
import { key_slp } from "../../utils/constants";
import { read, update } from "../../utils/packageJson";

export const setSlp = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  packageJson[key_slp] = await getCommandVersion();
  update(dir, packageJson);
};
