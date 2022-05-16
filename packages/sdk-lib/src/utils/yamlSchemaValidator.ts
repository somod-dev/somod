import { load as loadSchema } from "@solib/schema-manager";
import { getAjv, validate as jsonValidator } from "@solib/json-validator";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { load } from "js-yaml";
import { DataValidationError } from "@solib/errors";

export const yamlSchemaValidator = async (
  schemaId: string,
  yamlFilePath: string,
  dir: string
): Promise<void> => {
  if (existsSync(yamlFilePath)) {
    const ajv = getAjv({ strictTuples: false });

    const validate = await loadSchema(schemaId, ajv, dir);

    const yamlContent = await readFile(yamlFilePath, {
      encoding: "utf8"
    });
    const yamlContentAsJson = load(yamlContent);
    try {
      jsonValidator(null, yamlContentAsJson, validate);
    } catch (e) {
      if (e instanceof DataValidationError) {
        throw new Error(
          `${yamlFilePath} has following errors\n${e.violations
            .map(v => " " + (v.path + " " + v.message).trim())
            .join("\n")}`
        );
      } else {
        throw e;
      }
    }
  }
};
