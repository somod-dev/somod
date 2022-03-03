import Ajv, { SchemaObject, ValidateFunction } from "ajv";
import { readFile } from "fs/promises";
import { get as httpGet } from "http";
import { get as httpsGet } from "https";
import { join } from "path";
import { URL } from "url";
import { getModuleFromUri, idBase, parseSchema } from "./common";
import { dfs } from "@solib/graph";

const uriReferenceToUri = (input: string, base: string): string => {
  const url = new URL(input, base);
  return url.toString();
};

type LoadedSchema = { schema: SchemaObject; refs: string[] };

export const extractReferences = (schema: string): LoadedSchema => {
  const correctedSchema = schema.replaceAll(
    "https://json-schema.org/draft-07/schema", // vs-code extension redhat.vscode-yaml requires https://json-schema.org/draft-07/schema
    "http://json-schema.org/draft-07/schema" // ajv requires http://json-schema.org/draft-07/schema
  );

  const schemaObj: SchemaObject = JSON.parse(correctedSchema);
  const _refs: string[] = [];
  parseSchema(schemaObj, (id, ref, isSchema) => {
    const refUri = uriReferenceToUri(ref, id);
    if (!isSchema) {
      _refs.push(refUri);
    }
    return refUri;
  });
  const refs = _refs
    .map(ref => {
      const url = new URL(ref);
      return `${url.protocol}//${url.host}${url.pathname}`; // drop fragment in uri
    })
    .filter($ref => $ref != schemaObj.$id); // filter references to same file

  const uniqRefs = Array.from(new Set(refs));

  return { schema: schemaObj, refs: uniqRefs };
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

const rootMetaSchema = "http://json-schema.org/draft-07/schema";

const loadSchemas = async (
  dir: string,
  id: string
): Promise<Record<string, LoadedSchema>> => {
  const loadedSchemas: Record<string, LoadedSchema> = {};

  const _loadSchemaInternal = async (_id: string): Promise<LoadedSchema> => {
    if (_id == rootMetaSchema) {
      return { schema: { $id: _id }, refs: [] };
    }
    let fileContent: string = null;
    if (_id.startsWith(idBase)) {
      const moduleName = getModuleFromUri(_id);
      const moduleRootDir = join(dir, "node_modules", moduleName);
      const relativePath = _id.substring(`${idBase}/${moduleName}/`.length);

      fileContent = await loadFromFile(join(moduleRootDir, relativePath));
    } else {
      fileContent = await loadFromWeb(_id);
    }

    const loadedSchema = extractReferences(fileContent);
    await Promise.all(
      [loadedSchema.schema.$schema, ...loadedSchema.refs].map(async childId => {
        if (!loadedSchemas[childId]) {
          loadedSchemas[childId] = await _loadSchemaInternal(childId);
        }
        return loadedSchemas[childId];
      })
    );

    return loadedSchema;
  };

  loadedSchemas[id] = await _loadSchemaInternal(id);

  return loadedSchemas;
};

const applySchemas = (ajv: Ajv, schemaMap: Record<string, LoadedSchema>) => {
  const schemaNodes = Object.values(schemaMap).map(s => ({
    name: s.schema.$id,
    children: s.refs
  }));

  const sortedSchemaNodes = dfs(schemaNodes);

  for (const node of sortedSchemaNodes) {
    if (node.name != rootMetaSchema) {
      ajv.addSchema(schemaMap[node.name].schema);
    }
  }
};

export const load = async (
  id: string,
  ajv: Ajv,
  dir: string
): Promise<ValidateFunction> => {
  const schemas = await loadSchemas(dir, id);
  applySchemas(ajv, schemas);

  return ajv.compile(schemas[id].schema);
};
