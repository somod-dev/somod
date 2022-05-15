import { load as loadSchema } from "@solib/schema-manager";
import { getAjv, validate as jsonValidator } from "@solib/json-validator";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { load } from "js-yaml";
import { join } from "path";
import {
  file_templateYaml,
  key_serverlessSchema,
  path_serverless
} from "../../utils/constants";
import { DataValidationError } from "@solib/errors";
import { read } from "../../utils/packageJson";

export const validateSchema = async (dir: string): Promise<void> => {
  const templateYamlPath = join(dir, path_serverless, file_templateYaml);
  if (existsSync(templateYamlPath)) {
    const ajv = getAjv({ strictTuples: false });
    const packageJson = await read(dir);
    const schemaId = (packageJson[key_serverlessSchema] ||
      "https://json-schema.sodaru.com/@somod/serverless-schema/schemas/index.json") as string;
    const validate = await loadSchema(schemaId, ajv, dir);

    const templateYamlContent = await readFile(templateYamlPath, {
      encoding: "utf8"
    });
    const templateYamlContentAsJson = load(templateYamlContent);
    try {
      jsonValidator(null, templateYamlContentAsJson, validate);
    } catch (e) {
      if (e instanceof DataValidationError) {
        throw new Error(
          `${templateYamlPath} has following errors\n${e.violations
            .map(v => " " + (v.path + " " + v.message).trim())
            .join("\n")}`
        );
      } else {
        throw e;
      }
    }
  }
};
