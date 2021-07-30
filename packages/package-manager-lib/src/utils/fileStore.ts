import { cloneDeep } from "lodash";
import { normalize } from "path";

const readPromises: Record<string, Promise<unknown>> = {};

const dataMap: Record<string, unknown> = {};

type Reader<T> = (path: string) => Promise<T>;
type Writer<T> = (path: string, data: T) => Promise<void>;

export const read = async <T>(path: string, reader: Reader<T>): Promise<T> => {
  const normalizedPath = normalize(path);
  if (!dataMap[normalizedPath]) {
    if (!readPromises[normalizedPath]) {
      readPromises[normalizedPath] = reader(normalizedPath);
    }
    try {
      const data = await readPromises[normalizedPath];
      dataMap[normalizedPath] = data;
    } catch (e) {
      delete readPromises[normalizedPath];
      throw e;
    }
  }
  return cloneDeep(dataMap[normalizedPath]) as T;
};

export const update = <T>(path: string, data: T): void => {
  const normalizedPath = normalize(path);
  dataMap[normalizedPath] = cloneDeep(data);
};

export const save = async <T>(
  path: string,
  writer: Writer<T>
): Promise<void> => {
  const normalizedPath = normalize(path);
  if (dataMap[normalizedPath]) {
    await writer(normalizedPath, dataMap[normalizedPath] as T);
  }
};
