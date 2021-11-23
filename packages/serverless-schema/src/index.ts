import Ajv, { AnySchemaObject, ValidateFunction } from "ajv";
import { readFile } from "fs/promises";
import { get as httpGet } from "http";
import { get as httpsGet } from "https";
import { join } from "path";
import { URL } from "url";
import { isPlainObject, isArray, isString } from "lodash";

const idBase = "https://json-schema.sodaru.com";

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

const getModuleFromUri = (uri: string): string => {
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

const uriReferenceToUri = (input: string, base: string): string => {
  let _input = input;
  if (_input.indexOf("/node_modules/")) {
    const baseModuleName = getModuleFromUri(base) as string;
    const replacement = baseModuleName.startsWith(`@`) ? "/../../" : "/../";
    _input = _input.replace("/node_modules/", replacement);
  }
  const url = new URL(_input, base);
  return url.toString();
};

const extractReferences = (
  schema: string
): { schema: AnySchemaObject; $refs: string[] } => {
  const correctedSchema = schema.replaceAll(
    "https://json-schema.org/draft-07/schema", // vs-code extension redhat.vscode-yaml requires https://json-schema.org/draft-07/schema
    "http://json-schema.org/draft-07/schema" // ajv requires http://json-schema.org/draft-07/schema
  );

  const schemaObj: AnySchemaObject = JSON.parse(correctedSchema);
  schemaObj.$schema = uriReferenceToUri(schemaObj.$schema, schemaObj.$id);

  const $_refs: string[] = [];
  const objectsToBeParsed = [schemaObj];
  while (objectsToBeParsed.length > 0) {
    const objectToBeParsed = objectsToBeParsed.shift();
    if (isPlainObject(objectToBeParsed)) {
      if (isString(objectToBeParsed.$ref)) {
        const $_ref = uriReferenceToUri(objectToBeParsed.$ref, schemaObj.$id);
        objectToBeParsed.$ref = $_ref;
        $_refs.push($_ref);
      }
      objectsToBeParsed.push(...Object.values(objectToBeParsed));
    } else if (isArray(objectToBeParsed)) {
      objectsToBeParsed.push(...objectToBeParsed);
    }
  }
  const $refs = $_refs
    .map($ref => {
      const url = new URL($ref);
      return `${url.protocol}//${url.host}${url.pathname}`; // drop fragment in uri
    })
    .filter($ref => $ref != schemaObj.$id); // filter references to same file

  return { schema: schemaObj, $refs };
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
  rootModuleName: string,
  loadType: "addSchema" | "addMetaSchema" | "compile"
): Promise<void | ValidateFunction> => {
  if (!visitedIds.includes(id)) {
    visitedIds.push(id);

    let fileContent: string = null;
    if (id.startsWith(idBase)) {
      const moduleName = getModuleFromUri(id);
      const moduleRootDir =
        moduleName == rootModuleName
          ? dir
          : join(dir, "node_modules", moduleName);
      const relativePath = id.substr(`${idBase}/${moduleName}/`.length);
      fileContent = await loadFromFile(join(moduleRootDir, relativePath));
    } else {
      fileContent = await loadFromWeb(id);
    }

    const { schema, $refs } = extractReferences(fileContent);
    await parseAndLoad(
      schema.$schema,
      ajv,
      dir,
      rootModuleName,
      "addMetaSchema"
    );
    await Promise.all(
      $refs.map($ref =>
        parseAndLoad($ref, ajv, dir, rootModuleName, "addSchema")
      )
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

export const compile = async (
  dir: string,
  ajv: Ajv
): Promise<ValidateFunction> => {
  const packageJsonStr = await readFile(join(dir, "package.json"), {
    encoding: "utf8"
  });
  const packageJson = JSON.parse(packageJsonStr);
  const id = packageJson.serverlessSchema;

  const thisModuleName = "@somod/serverless-schema";

  const schemaToCompile =
    id || `${idBase}/${thisModuleName}/schemas/index.json`;

  resetVisitedIds();

  const validateFunction = (await parseAndLoad(
    schemaToCompile,
    ajv,
    dir,
    packageJson.name,
    "compile"
  )) as ValidateFunction;

  return validateFunction;
};
