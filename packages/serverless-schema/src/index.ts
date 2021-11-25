import Ajv, { ValidateFunction } from "ajv";
import { readFile } from "fs/promises";
import { join } from "path";
import { load } from "./lib/load";
import { idBase } from "./lib/common";
export { buildSchemaDir as build } from "./lib/build";

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

  const validateFunction = await load(schemaToCompile, ajv, dir);

  return validateFunction;
};
