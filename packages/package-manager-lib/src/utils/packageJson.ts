import { join, normalize } from "path";
import { file_packageJson } from "./constants";
import { read as readJson, update as updateJson } from "./jsonFileStore";
import unixStylePath from "./unixStylePath";

export const read = async (dir: string): Promise<Record<string, unknown>> => {
  const packageJsonPath = join(dir, file_packageJson);
  const packageJsonContent = await readJson(packageJsonPath);
  return packageJsonContent;
};

export const update = (
  dir: string,
  packageJson: Record<string, unknown>
): void => {
  const packageJsonPath = join(dir, file_packageJson);
  updateJson(packageJsonPath, packageJson);
};

export const packageJsonPath = (dir: string): string => {
  return unixStylePath(normalize(join(dir, file_packageJson)));
};
