import { readFile } from "fs/promises";
import { normalize } from "path";

type JSONType = Record<string, unknown>;

const readJson = async (path: string): Promise<JSONType> => {
  const jsonContent = await readFile(path, { encoding: "utf8" });
  const _json = JSON.parse(jsonContent);
  return _json;
};

const readJsonPromises: Record<string, Promise<JSONType>> = {};

const jsonStore = (path: string): Promise<JSONType> => {
  const normalizedPath = normalize(path);
  if (!readJsonPromises[normalizedPath]) {
    readJsonPromises[normalizedPath] = readJson(normalizedPath);
  }
  return readJsonPromises[normalizedPath];
};

export default jsonStore;
