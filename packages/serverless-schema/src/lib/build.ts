import { AnySchemaObject } from "ajv";
import { readdir, readFile, stat, writeFile } from "fs/promises";
import { join } from "path";
import { getModuleFromUri, parseSchema } from "./common";

const correctUriReference = (input: string, base: string): string => {
  let _input = input;
  if (_input.indexOf("/node_modules/")) {
    const baseModuleName = getModuleFromUri(base) as string;
    const replacement = baseModuleName.startsWith(`@`) ? "/../../" : "/../";
    _input = _input.replace("/node_modules/", replacement);
  }
  return _input;
};

const correctReferences = (schema: string): string => {
  const schemaObj: AnySchemaObject = JSON.parse(schema);

  parseSchema(schemaObj, (id, ref) => {
    return correctUriReference(ref, id);
  });

  return JSON.stringify(schemaObj, null, 2);
};

const buildSchema = async (file: string): Promise<void> => {
  const schema = await readFile(file, { encoding: "utf8" });
  const correctedSchema = correctReferences(schema);
  await writeFile(file, correctedSchema);
};

export const buildSchemaDir = async (dir: string): Promise<void> => {
  const dirsToBuild: string[] = [dir];
  while (dirsToBuild.length > 0) {
    const dirToBuild = dirsToBuild.shift();
    const files = await readdir(dirToBuild);
    await Promise.all(
      files.map(async file => {
        const fileOrDirPath = join(dirToBuild, file);
        const stats = await stat(fileOrDirPath);
        if (stats.isDirectory()) {
          dirsToBuild.push(fileOrDirPath);
        } else {
          await buildSchema(fileOrDirPath);
        }
      })
    );
  }
};
