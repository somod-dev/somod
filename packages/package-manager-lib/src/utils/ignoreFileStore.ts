import { readFile } from "fs/promises";
import { normalize } from "path";

type IgnoreType = string[];

const readIgnoreFile = async (path: string): Promise<IgnoreType> => {
  const ignoreContent = await readFile(path, { encoding: "utf8" });
  const _ignore = ignoreContent.split("\n");
  return _ignore;
};

const readIgnoreFilePromises: Record<string, Promise<IgnoreType>> = {};

const ignoreFileStore = (path: string): Promise<IgnoreType> => {
  const normalizedPath = normalize(path);
  if (!readIgnoreFilePromises[normalizedPath]) {
    readIgnoreFilePromises[normalizedPath] = readIgnoreFile(normalizedPath);
  }
  return readIgnoreFilePromises[normalizedPath];
};

export default ignoreFileStore;
