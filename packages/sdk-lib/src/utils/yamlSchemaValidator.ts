import { DataValidationError } from "@solib/errors";
import {
  CompiledValidateFunction,
  validate as jsonValidator
} from "@solib/json-validator";
import { existsSync } from "fs";
import { readYamlFileStore } from "./yamlFileStore";

export const yamlSchemaValidator = async (
  schemaValidator: CompiledValidateFunction,
  yamlFilePath: string
): Promise<void> => {
  if (existsSync(yamlFilePath)) {
    const yamlContentAsJson = await readYamlFileStore(yamlFilePath);
    try {
      jsonValidator(schemaValidator, yamlContentAsJson);
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
