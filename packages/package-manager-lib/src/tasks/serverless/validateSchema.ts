import { ErrorSet } from "@sodaru-cli/base";
import { loadSchemas } from "@sodaru-cli/serverless-schema";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { load } from "js-yaml";
import { join } from "path";
import { file_templateYaml, path_serverless } from "../../utils/constants";

export const validateSchema = async (dir: string): Promise<void> => {
  const templateYamlPath = join(dir, path_serverless, file_templateYaml);
  if (existsSync(templateYamlPath)) {
    const ajv = new Ajv();
    addFormats(ajv);
    const validate = await loadSchemas(ajv);

    const templateYamlContent = await readFile(templateYamlPath, {
      encoding: "utf8"
    });
    const templateYamlContentAsJson = load(templateYamlContent);
    if (!validate(templateYamlContentAsJson)) {
      throw new ErrorSet(
        validate.errors?.map(error => {
          return new Error(`"${error.instancePath}" ${error.message}`);
        })
      );
    }
  }
};
