import { join, normalize } from "path";
import { file_packageJson } from "./constants";
import {
  readJsonFileStore,
  updateJsonFileStore,
  unixStylePath
} from "@solib/cli-base";

export const read = async (dir: string): Promise<Record<string, unknown>> => {
  const packageJsonPath = join(dir, file_packageJson);
  const packageJsonContent = await readJsonFileStore(packageJsonPath);
  return packageJsonContent;
};

export const update = (
  dir: string,
  packageJson: Record<string, unknown>
): void => {
  const packageJsonPath = join(dir, file_packageJson);
  updateJsonFileStore(packageJsonPath, packageJson);
};

export const packageJsonPath = (dir: string): string => {
  return unixStylePath(normalize(join(dir, file_packageJson)));
};
