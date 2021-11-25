import Ajv, { AnySchemaObject, ValidateFunction } from "ajv";
import { readFile } from "fs/promises";
import { get as httpGet } from "http";
import { get as httpsGet } from "https";
import { join } from "path";
import { URL } from "url";
import { getModuleFromUri, idBase, parseSchema } from "./common";

const uriReferenceToUri = (input: string, base: string): string => {
  const url = new URL(input, base);
  return url.toString();
};

export const extractReferences = (
  schema: string
): { schema: AnySchemaObject; $refs: string[] } => {
  const correctedSchema = schema.replaceAll(
    "https://json-schema.org/draft-07/schema", // vs-code extension redhat.vscode-yaml requires https://json-schema.org/draft-07/schema
    "http://json-schema.org/draft-07/schema" // ajv requires http://json-schema.org/draft-07/schema
  );

  const schemaObj: AnySchemaObject = JSON.parse(correctedSchema);
  const $_refs: string[] = [];
  parseSchema(schemaObj, (id, ref, isSchema) => {
    const refUri = uriReferenceToUri(ref, id);
    if (!isSchema) {
      $_refs.push(refUri);
    }
    return refUri;
  });
  const $refs = $_refs
    .map($ref => {
      const url = new URL($ref);
      return `${url.protocol}//${url.host}${url.pathname}`; // drop fragment in uri
    })
    .filter($ref => $ref != schemaObj.$id); // filter references to same file

  return { schema: schemaObj, $refs };
};

const loadFromFile = async (path: string): Promise<string> => {
  const content = readFile(path, { encoding: "utf8" });
  return content;
};

const loadFromWeb = (uri: string): Promise<string> => {
  const requestFunction = uri.startsWith("https://") ? httpsGet : httpGet;
  return new Promise((resolve, reject) => {
    const request = requestFunction(uri, res => {
      if (!(res.statusCode >= 200 && res.statusCode < 300)) {
        reject(
          new Error(
            `Invalid response from ${uri}, statusCode : ${res.statusCode}`
          )
        );
      }
      const chunks: string[] = [];
      res.on("data", chunk => {
        chunks.push(chunk);
      });
      res.on("end", () => {
        resolve(chunks.join(""));
      });
    });
    request.on("error", e => {
      reject(e);
    });
  });
};

const visitedIds: string[] = [];

const resetVisitedIds = () => {
  // RESET visited Ids
  while (visitedIds.length > 0) {
    visitedIds.pop();
  }
  visitedIds.push("http://json-schema.org/draft-07/schema");
};

const parseAndLoad = async (
  id: string,
  ajv: Ajv,
  dir: string,
  loadType: "addSchema" | "addMetaSchema" | "compile"
): Promise<void | ValidateFunction> => {
  if (!visitedIds.includes(id)) {
    visitedIds.push(id);

    let fileContent: string = null;
    if (id.startsWith(idBase)) {
      const moduleName = getModuleFromUri(id);
      const moduleRootDir = join(dir, "node_modules", moduleName);
      const relativePath = id.substr(`${idBase}/${moduleName}/`.length);
      fileContent = await loadFromFile(join(moduleRootDir, relativePath));
    } else {
      fileContent = await loadFromWeb(id);
    }

    const { schema, $refs } = extractReferences(fileContent);
    await parseAndLoad(schema.$schema, ajv, dir, "addMetaSchema");
    await Promise.all(
      $refs.map($ref => parseAndLoad($ref, ajv, dir, "addSchema"))
    );

    if (loadType == "addMetaSchema") {
      if (!ajv.getSchema(id)) {
        ajv.addMetaSchema(schema);
      }
    } else if (loadType == "addSchema") {
      if (!ajv.getSchema(id)) {
        ajv.addSchema(schema);
      }
    } else {
      return ajv.compile(schema);
    }
  }
};

export const load = async (
  id: string,
  ajv: Ajv,
  dir: string
): Promise<ValidateFunction> => {
  resetVisitedIds();

  const validateFunction = (await parseAndLoad(
    id,
    ajv,
    dir,
    "compile"
  )) as ValidateFunction;

  return validateFunction;
};
