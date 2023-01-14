import { IContext, KeywordValidator } from "somod-types";
import ErrorSet from "../../ErrorSet";
import { parseJson, validateKeywords } from "../../jsonTemplate";
import { getBaseKeywords } from "./serverlessTemplate";

/**
 * Validate the `serverless/template.yaml` at the root module.
 *
 * Assumption is that `serverless/template.yaml` is present in root module
 */
export const validateServerlessTemplate = async (
  context: IContext,
  rootModuleName: string
) => {
  const keywords = [
    ...getBaseKeywords(),
    ...context.lifecycleHandler.serverlessKeywords.map(k => k.keyword)
  ];

  const keywordValidators: Record<string, KeywordValidator> = {};

  await Promise.all(
    keywords.map(async keyword => {
      const validator = await keyword.getValidator(rootModuleName, context);

      keywordValidators[keyword.keyword] = validator;
    })
  );

  const errors = await validateKeywords(
    parseJson(
      (
        await context.serverlessTemplateHandler.getTemplate(rootModuleName)
      ).template
    ),
    keywordValidators
  );

  if (errors.length > 0) {
    throw new ErrorSet(errors);
  }
};
