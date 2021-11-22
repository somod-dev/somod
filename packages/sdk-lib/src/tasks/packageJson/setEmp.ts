import { key_emp } from "../../utils/constants";
import { read, update } from "../../utils/packageJson";

export const setEmp = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);
  packageJson[key_emp] = true;
  update(dir, packageJson);
};
