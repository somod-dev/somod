import { difference, padEnd, union } from "lodash";
import { join, normalize } from "path";
import { path_build, path_nodeModules } from "./constants";
import { read, update as updateIgnoreFile } from "./ignoreFileStore";

const readIgnoreFile = async (dir: string, file: string): Promise<string[]> => {
  const _ignoreFilePath = join(dir, file);
  const ignoreContent = await read(_ignoreFilePath);
  return ignoreContent;
};

const ignoreFilePath = (dir: string, file: string): string => {
  return normalize(join(dir, file)).split("\\").join("/");
};

const defaultPaths = [path_nodeModules, path_build];

export const validate = async (
  dir: string,
  paths: string[],
  ignoreFile: string
): Promise<void> => {
  const actualIgnorePaths = await readIgnoreFile(dir, ignoreFile);

  const expectedIgnorePaths = [...defaultPaths, ...paths];

  const _actualIgnorePaths = actualIgnorePaths.map(p => p.trim());
  const _expectedIgnorePaths = expectedIgnorePaths.map(p => p.trim());

  const missingIgnorePaths = difference(
    _expectedIgnorePaths,
    _actualIgnorePaths
  );

  if (missingIgnorePaths.length > 0) {
    throw new Error(
      `${missingIgnorePaths.join(", ")} must be in ${ignoreFilePath(
        dir,
        ignoreFile
      )}`
    );
  }
};

export const update = async (
  dir: string,
  paths: string[],
  ignoreFile: string
): Promise<void> => {
  const ignoreFilePath = join(dir, ignoreFile);
  let actualIgnorePaths: string[] = null;
  try {
    actualIgnorePaths = await readIgnoreFile(dir, ignoreFile);
  } catch (e) {
    actualIgnorePaths = [];
  }

  // pad empty lines to make then unque for union operation
  actualIgnorePaths = actualIgnorePaths.map((ignorePath, i) => {
    if (ignorePath.trim() == "") {
      return padEnd("", i + 1, " ");
    }
    return ignorePath;
  });

  const newIgnorePaths = union(actualIgnorePaths, defaultPaths, paths).map(
    ignorePath => ignorePath.trim()
  );

  updateIgnoreFile(ignoreFilePath, newIgnorePaths);
};
