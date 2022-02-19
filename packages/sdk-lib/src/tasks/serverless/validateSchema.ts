import { ErrorSet } from "@sodaru/cli-base";
import { compile } from "@somod/serverless-schema";
import { getAjv } from "@solib/json-validator";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { load } from "js-yaml";
import { join } from "path";
import { file_templateYaml, path_serverless } from "../../utils/constants";

export const validateSchema = async (dir: string): Promise<void> => {
  const templateYamlPath = join(dir, path_serverless, file_templateYaml);
  if (existsSync(templateYamlPath)) {
    const ajv = getAjv();
    ajv.opts.strictTuples = false;
    const validate = await compile(dir, ajv);

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
