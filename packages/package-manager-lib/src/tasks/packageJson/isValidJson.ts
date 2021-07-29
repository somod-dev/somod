import { isPlainObject } from "lodash";
import readPackageJson, { packageJsonPath } from "../../utils/readPackageJson";

export const isValidJson = async (dir: string): Promise<void> => {
  const packageJsonContent = await readPackageJson(dir);

  if (isPlainObject(packageJsonContent)) {
    throw new Error(`${packageJsonPath(dir)} is not a valid JSON`);
  }
};
