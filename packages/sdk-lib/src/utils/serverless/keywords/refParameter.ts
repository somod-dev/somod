import {
  KeywordSLPRefParameter,
  ServerlessTemplate,
  SLPRefParameter,
  SLPTemplate
} from "../types";
import { getSLPKeyword } from "./utils";

export const validate = (
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
): Error[] => {
  const errors: Error[] = [];

  slpTemplate.keywordPaths[KeywordSLPRefParameter].forEach(
    refParameterKeywordPath => {
      const refParameter = getSLPKeyword<SLPRefParameter>(
        slpTemplate,
        refParameterKeywordPath
      )[KeywordSLPRefParameter];

      const referencedSLPTemplate =
        refParameter.module == slpTemplate.module
          ? slpTemplate
          : serverlessTemplate[refParameter.module];

      if (
        !(
          referencedSLPTemplate?.Parameters &&
          referencedSLPTemplate?.Parameters[refParameter.parameter]
        )
      ) {
        errors.push(
          new Error(
            `Referenced module parameter {${refParameter.module}, ${
              refParameter.parameter
            }} not found. Referenced in "${
              slpTemplate.module
            }" at "Resources/${refParameterKeywordPath.join("/")}"`
          )
        );
      }
    }
  );

  return errors;
};
