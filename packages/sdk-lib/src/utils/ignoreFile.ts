import { difference, padEnd, union } from "lodash";
import { dirname, join, normalize, relative } from "path";
import { file_parametersJson, path_build, path_nodeModules } from "./constants";
import {
  readIgnoreFileStore,
  updateIgnoreFileStore,
  saveIgnoreFileStore,
  unixStylePath
} from "@solib/cli-base";
import { existsSync } from "fs";

// read from ignore file in current dir to any parent dir
// usefull in monorepo cases , .prettierignore and .eslintignore will be in parent directory at repo root, somod are at package level
const locateIgnoreFile = (dir: string, ignoreFileName: string): string => {
  const paths = unixStylePath(normalize(dir)).split("/");

  paths[0] += "/"; // correcting first path , in windows  "C:" => "C:/" , in linux "" => "/"

  for (let i = paths.length; i > 0; i--) {
    const ignoreFilePath = join(...paths.slice(0, i), ignoreFileName);
    if (existsSync(ignoreFilePath)) {
      return unixStylePath(ignoreFilePath);
    }
  }

  throw new Error(
    `${ignoreFileName} is not found in any directory in the path ${dir}`
  );
};

const relativeIgnorePaths = (
  paths: string[],
  dir: string,
  ignoreFilePath: string
): string[] => {
  const relativePath =
    "/" + unixStylePath(relative(dirname(ignoreFilePath), dir));
  return paths.map(path => {
    if (path.startsWith("/") && relativePath.length > 1) {
      path = relativePath + path;
    }
    return path;
  });
};

const defaultPaths = [path_nodeModules, path_build, `/${file_parametersJson}`];

export const validate = async (
  dir: string,
  paths: string[],
  ignoreFile: string
): Promise<void> => {
  const ignoreFilePath = locateIgnoreFile(dir, ignoreFile);
  const actualIgnorePaths = await readIgnoreFileStore(ignoreFilePath);

  const expectedIgnorePaths = relativeIgnorePaths(
    [...defaultPaths, ...paths],
    dir,
    ignoreFilePath
  );

  const _actualIgnorePaths = actualIgnorePaths.map(p => p.trim());
  const _expectedIgnorePaths = expectedIgnorePaths.map(p => p.trim());

  const missingIgnorePaths = difference(
    _expectedIgnorePaths,
    _actualIgnorePaths
  );

  if (missingIgnorePaths.length > 0) {
    throw new Error(
      `${missingIgnorePaths.join(", ")} must be in ${locateIgnoreFile(
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
  let ignoreFilePath: string = null;
  try {
    ignoreFilePath = locateIgnoreFile(dir, ignoreFile);
  } catch (e) {
    ignoreFilePath = null;
  }

  let actualIgnorePaths: string[] = [];

  if (ignoreFilePath == null) {
    ignoreFilePath = join(dir, ignoreFile);
  } else {
    actualIgnorePaths = await readIgnoreFileStore(ignoreFilePath);
  }

  // pad empty lines to make them unique for union operation
  actualIgnorePaths = actualIgnorePaths.map((ignorePath, i) => {
    if (ignorePath.trim() == "") {
      return padEnd("", i + 1, " ");
    }
    return ignorePath;
  });

  const pathsToBeAdded = relativeIgnorePaths(
    [...defaultPaths, ...paths],
    dir,
    ignoreFilePath
  );

  const newIgnorePaths = union(actualIgnorePaths, pathsToBeAdded).map(
    ignorePath => ignorePath.trim()
  );

  updateIgnoreFileStore(ignoreFilePath, newIgnorePaths);
};

export const save = async (dir: string, ignoreFile: string): Promise<void> => {
  let ignoreFilePath: string = null;
  try {
    ignoreFilePath = locateIgnoreFile(dir, ignoreFile);
  } catch (e) {
    ignoreFilePath = join(dir, ignoreFile);
  }

  await saveIgnoreFileStore(ignoreFilePath);
};
