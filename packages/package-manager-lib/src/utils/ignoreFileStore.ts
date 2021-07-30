import { readFile, writeFile } from "fs/promises";
import {
  read as storeRead,
  update as storeUpdate,
  save as storeSave
} from "./fileStore";

type IgnoreType = string[];

const readIgnoreFile = async (path: string): Promise<IgnoreType> => {
  const ignoreContent = await readFile(path, { encoding: "utf8" });
  const _ignore =
    ignoreContent.trim().length == 0 ? [] : ignoreContent.split("\n");
  return _ignore;
};

const writeIgnoreFile = async (
  path: string,
  ignore: IgnoreType
): Promise<void> => {
  const _json = ignore.join("\n");
  await writeFile(path, _json);
};

export const read = async (path: string): Promise<IgnoreType> => {
  return await storeRead(path, readIgnoreFile);
};

export const update = (path: string, json: IgnoreType): void => {
  return storeUpdate(path, json);
};

export const save = async (path: string): Promise<void> => {
  return await storeSave(path, writeIgnoreFile);
};
