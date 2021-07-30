import { readFile, writeFile } from "fs/promises";
import {
  read as storeRead,
  update as storeUpdate,
  save as storeSave
} from "./fileStore";

type JSONType = Record<string, unknown>;

const readJson = async (path: string): Promise<JSONType> => {
  const jsonContent = await readFile(path, { encoding: "utf8" });
  const _json = JSON.parse(jsonContent);
  return _json;
};

const writeJson = async (path: string, json: JSONType): Promise<void> => {
  const _json = JSON.stringify(json, null, 2);
  await writeFile(path, _json);
};

export const read = async (path: string): Promise<JSONType> => {
  return await storeRead(path, readJson);
};

export const update = (path: string, json: JSONType): void => {
  return storeUpdate(path, json);
};

export const save = async (path: string): Promise<void> => {
  return await storeSave(path, writeJson);
};
