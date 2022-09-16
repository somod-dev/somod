import {
  CompiledValidateFunction,
  validate as jsonValidator
} from "decorated-ajv";
import { existsSync } from "fs";
import { readYamlFileStore } from "nodejs-file-utils";

export const yamlSchemaValidator = async (
  schemaValidator: CompiledValidateFunction,
  yamlFilePath: string
): Promise<void> => {
  if (existsSync(yamlFilePath)) {
    const yamlContentAsJson = await readYamlFileStore(yamlFilePath);
    const violations = await jsonValidator(schemaValidator, yamlContentAsJson);
    if (violations.length > 0) {
      throw new Error(
        `${yamlFilePath} has following errors\n${violations
          .map(v => " " + (v.path + " " + v.message).trim())
          .join("\n")}`
      );
    }
  }
};
