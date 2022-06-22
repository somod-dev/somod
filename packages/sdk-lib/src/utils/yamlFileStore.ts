import { readFile, writeFile } from "fs/promises";
import { readFileStore, updateFileStore, saveFileStore } from "@solib/cli-base";
import { load, dump } from "js-yaml";

type JSONType = Record<string, unknown>;

const readYaml = async (path: string): Promise<JSONType> => {
  const yamlContent = await readFile(path, {
    encoding: "utf8"
  });
  const json = load(yamlContent) as JSONType;
  return json;
};

const writeYaml = async (path: string, json: JSONType): Promise<void> => {
  const yaml = dump(json);
  await writeFile(path, yaml);
};

export const readYamlFileStore = async (
  path: string,
  force = false
): Promise<JSONType> => {
  return await readFileStore(path, readYaml, force);
};

export const updateYamlFileStore = (path: string, json: JSONType): void => {
  return updateFileStore(path, json);
};

export const saveYamlFileStore = async (path: string): Promise<void> => {
  return await saveFileStore(path, writeYaml);
};
