import { load as loadSchema } from "@solib/schema-manager";
import { getAjv, validate as jsonValidator } from "@solib/json-validator";
import { existsSync } from "fs";
import { DataValidationError } from "@solib/errors";
import { readYamlFileStore } from "./yamlFileStore";

export const yamlSchemaValidator = async (
  schemaId: string,
  yamlFilePath: string,
  dir: string
): Promise<void> => {
  if (existsSync(yamlFilePath)) {
    const ajv = getAjv({ strictTuples: false });

    const validate = await loadSchema(schemaId, ajv, dir);

    const yamlContentAsJson = await readYamlFileStore(yamlFilePath);
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
