import Ajv, { ValidateFunction } from "ajv";
import { readdir, readFile, stat } from "fs/promises";
import { join, normalize } from "path";

export const loadSchemas = async (ajv: Ajv): Promise<ValidateFunction> => {
  const dir = __dirname;
  const schemaDir = join(dir, "..", "schemas");

  const rootSchemaPath = normalize(join(schemaDir, "index.json"));

  const dirsToBeParsed = [schemaDir];
  while (dirsToBeParsed.length > 0) {
    const dirToParse = dirsToBeParsed.shift();
    const dirContent = await readdir(dirToParse);
    await Promise.all(
      dirContent.map(async file => {
        const path = join(dirToParse, file);
        const stats = await stat(path);
        if (stats.isDirectory()) {
          dirsToBeParsed.push(path);
        } else {
          if (normalize(path) != rootSchemaPath) {
            let schema = await readFile(path, { encoding: "utf8" });
            schema = schema.replaceAll(
              "https://json-schema.org/draft-07/schema", // vs-code extension redhat.vscode-yaml requires https://json-schema.org/draft-07/schema
              "http://json-schema.org/draft-07/schema" // ajv requires http://json-schema.org/draft-07/schema
            );
            ajv.addSchema(JSON.parse(schema));
          }
        }
      })
    );
  }

  const rootSchemaContent = await readFile(rootSchemaPath, {
    encoding: "utf8"
  });
  const rootSchema = JSON.parse(rootSchemaContent);
  return ajv.compile(rootSchema);
};
