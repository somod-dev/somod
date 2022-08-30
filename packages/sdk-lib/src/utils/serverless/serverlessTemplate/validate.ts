import { ErrorSet } from "@solib/cli-base";
import {
  JSONType,
  KeywordValidator,
  parseJson,
  validateKeywords
} from "../../jsonTemplate";
import { ModuleServerlessTemplateMap } from "../types";
import { getKeywords, getModuleContentMap } from "./serverlessTemplate";

/**
 * Validate the `serverless/template.yaml` at the root module.
 *
 * Assumption is that `serverless/template.yaml` is present in root module
 */
export const validateServerlessTemplate = async (
  dir: string,
  rootModuleName: string,
  moduleTemplateMap: ModuleServerlessTemplateMap
) => {
  const moduleContentMap = getModuleContentMap(moduleTemplateMap);

  const keywords = getKeywords();

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

  const errors = validateKeywords(
    parseJson(moduleTemplateMap[rootModuleName].template as JSONType),
    keywordValidators
  );

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};
