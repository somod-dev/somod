import { KeywordDefinition, KeywordValidator } from "somod-types";
import ErrorSet from "../../ErrorSet";
import { parseJson, validateKeywords } from "../../jsonTemplate";
import {
  getBaseKeywords,
  getModuleServerlessTemplateMap
} from "./serverlessTemplate";

/**
 * Validate the `serverless/template.yaml` at the root module.
 *
 * Assumption is that `serverless/template.yaml` is present in root module
 */
export const validateServerlessTemplate = async (
  dir: string,
  rootModuleName: string,
  pluginKeywords: KeywordDefinition[] = []
) => {
  const moduleContentMap = await getModuleServerlessTemplateMap();

  const keywords = [...getBaseKeywords(), ...pluginKeywords];

  const keywordValidators: Record<string, KeywordValidator> = {};

  await Promise.all(
    keywords.map(async keyword => {
      const validator = await keyword.getValidator(
        dir,
        rootModuleName,
        moduleContentMap
      );

      keywordValidators[keyword.keyword] = validator;
    })
  );

  const errors = await validateKeywords(
    parseJson(moduleContentMap[rootModuleName].json),
    keywordValidators
  );

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};
