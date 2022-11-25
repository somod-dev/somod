import { KeywordDefinition, KeywordValidator } from "somod-types";
import ErrorSet from "../../ErrorSet";
import { parseJson, validateKeywords } from "../../jsonTemplate";
import { ModuleHandler } from "../../moduleHandler";
import {
  getBaseKeywords,
  ServerlessTemplateHandler
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
  const moduleHandler = ModuleHandler.getModuleHandler();
  const serverlessTemplateHandler =
    ServerlessTemplateHandler.getServerlessTemplateHandler();

  const keywords = [...getBaseKeywords(), ...pluginKeywords];

  const keywordValidators: Record<string, KeywordValidator> = {};

  await Promise.all(
    keywords.map(async keyword => {
      const validator = await keyword.getValidator(
        dir,
        rootModuleName,
        moduleHandler,
        serverlessTemplateHandler
      );

      keywordValidators[keyword.keyword] = validator;
    })
  );

  const errors = await validateKeywords(
    parseJson(
      (
        await serverlessTemplateHandler.getTemplate(rootModuleName)
      ).template
    ),
    keywordValidators
  );

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};
