import { key_emp } from "../../utils/constants";
import { read, packageJsonPath } from "../../utils/packageJson";

export const doesEmpIsTrue = async (dir: string): Promise<void> => {
  const packageJson = await read(dir);

  if (packageJson[key_emp] !== true) {
    throw new Error(`${key_emp} must be true in ${packageJsonPath(dir)}`);
  }
};
