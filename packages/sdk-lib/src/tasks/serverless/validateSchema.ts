import { compile } from "@somod/serverless-schema";
import { getAjv, validate as jsonValidator } from "@solib/json-validator";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { load } from "js-yaml";
import { join } from "path";
import { file_templateYaml, path_serverless } from "../../utils/constants";
import { DataValidationError } from "@solib/errors";

export const validateSchema = async (dir: string): Promise<void> => {
  const templateYamlPath = join(dir, path_serverless, file_templateYaml);
  if (existsSync(templateYamlPath)) {
    const ajv = getAjv({ strictTuples: false });
    const validate = await compile(dir, ajv);

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
