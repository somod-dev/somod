import {
  KeywordSLPRefParameter,
  ServerlessTemplate,
  SLPRefParameter,
  SLPTemplate
} from "../types";
import {
  getSAMParameterName,
  getSLPKeyword,
  replaceSLPKeyword
} from "../utils";

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

      if (!refParameter.module) {
        refParameter.module = slpTemplate.module;
      }

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

export const apply = (serverlessTemplate: ServerlessTemplate) => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSLPRefParameter].forEach(
      refParameterPath => {
        const refParameter = getSLPKeyword<SLPRefParameter>(
          slpTemplate,
          refParameterPath
        )[KeywordSLPRefParameter];
        const parameterName = getSAMParameterName(
          refParameter.module || slpTemplate.module,
          refParameter.parameter
        );
        const refParameterValue = { Ref: parameterName };
        replaceSLPKeyword(slpTemplate, refParameterPath, refParameterValue);
      }
    );
  });
};
