import { join, normalize } from "path";
import { file_packageJson } from "./constants";
import jsonStore from "./jsonStore";

const readPackageJson = async (
  dir: string
): Promise<Record<string, unknown>> => {
  const packageJsonPath = join(dir, file_packageJson);
  const packageJsonContent = await jsonStore(packageJsonPath);
  return packageJsonContent;
};

export default readPackageJson;

export const packageJsonPath = (dir: string): string => {
  return normalize(join(dir, file_packageJson)).split("\\").join("/");
};
