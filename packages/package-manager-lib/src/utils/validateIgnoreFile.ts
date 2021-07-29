import { difference } from "lodash";
import { join, normalize } from "path";
import { path_build, path_nodeModules } from "./constants";
import ignoreFileStore from "./ignoreFileStore";

const readIgnoreFile = async (dir: string, file: string): Promise<string[]> => {
  const _ignoreFilePath = join(dir, file);
  const ignoreContent = await ignoreFileStore(_ignoreFilePath);
  return ignoreContent;
};

export const ignoreFilePath = (dir: string, file: string): string => {
  return normalize(join(dir, file));
};

const validateIgnoreFile = async (
  dir: string,
  paths: string[] = [],
  ignoreFile: string
): Promise<void> => {
  const actualIgnorePaths = await readIgnoreFile(dir, ignoreFile);

  const defaultPaths = [path_nodeModules, path_build];

  const expectedIgnorePaths = [...defaultPaths, ...paths];

  const _actualIgnorePaths = actualIgnorePaths.map(p => p.trim());
  const _expectedIgnorePaths = expectedIgnorePaths.map(p => p.trim());

  const missingIgnorePaths = difference(
    _expectedIgnorePaths,
    _actualIgnorePaths
  );

  if (missingIgnorePaths.length > 0) {
    throw new Error(
      `${missingIgnorePaths.join(", ")} must be in ${ignoreFile}`
    );
  }
};

export default validateIgnoreFile;
