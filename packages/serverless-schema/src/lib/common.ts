import { AnySchemaObject } from "ajv";
import { isArray, isPlainObject, isString } from "lodash";
import { URL } from "url";

export const idBase = "https://json-schema.sodaru.com";

export const getModuleFromUri = (uri: string): string => {
  let moduleName = null;
  if (uri.startsWith(idBase)) {
    const url = new URL(uri);
    const paths = url.pathname.split("/");
    if (paths.length >= 2) {
      moduleName = paths[1].startsWith("@")
        ? paths[1] + "/" + paths[2]
        : paths[1];
    }
  }
  if (!moduleName) {
    throw new Error(`Could not find modulename from ${uri}`);
  }
  return moduleName;
};

export const parseSchema = (
  schema: AnySchemaObject,
  onReference: (id: string, ref: string, isSchema?: boolean) => string
): void => {
  schema.$schema = onReference(schema.$id, schema.$schema, true);

  const objectsToBeParsed = [schema];
  while (objectsToBeParsed.length > 0) {
    const objectToBeParsed = objectsToBeParsed.shift();
    if (isPlainObject(objectToBeParsed)) {
      if (isString(objectToBeParsed.$ref)) {
        const $_ref = onReference(schema.$id, objectToBeParsed.$ref);
        objectToBeParsed.$ref = $_ref;
      }
      objectsToBeParsed.push(...Object.values(objectToBeParsed));
    } else if (isArray(objectToBeParsed)) {
      objectsToBeParsed.push(...objectToBeParsed);
    }
  }
};
