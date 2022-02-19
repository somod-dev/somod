import { getCommandVersion } from "@sodaru/cli-base";
import { key_njp } from "../../utils/constants";
import { read, update } from "../../utils/packageJson";

export const setNjp = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  packageJson[key_njp] = await getCommandVersion();
  update(dir, packageJson);
};
