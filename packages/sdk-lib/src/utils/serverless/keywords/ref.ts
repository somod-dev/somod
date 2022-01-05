import {
  KeywordSLPExtend,
  KeywordSLPOutput,
  KeywordSLPRef,
  ServerlessTemplate,
  SLPRef,
  SLPTemplate
} from "../types";
import { getSLPKeyword } from "./utils";

export const validate = (
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
): Error[] => {
  const errors: Error[] = [];

  slpTemplate.keywordPaths[KeywordSLPRef].forEach(refKeywordPath => {
    const ref = getSLPKeyword<SLPRef>(slpTemplate, refKeywordPath)[
      KeywordSLPRef
    ];
    const referencedSLPTemplate =
      ref.module == slpTemplate.module
        ? slpTemplate
        : serverlessTemplate[ref.module];

    const getError = (message: string) =>
      new Error(
        `Referenced module resource {${ref.module}, ${
          ref.resource
        }} ${message}. Referenced in "${
          slpTemplate.module
        }" at "Resources/${refKeywordPath.join("/")}"`
      );

    if (!referencedSLPTemplate?.Resources[ref.resource]) {
      errors.push(getError("not found"));
    } else if (
      referencedSLPTemplate.Resources[ref.resource][KeywordSLPExtend]
    ) {
      errors.push(getError(`must not have ${KeywordSLPExtend}`));
    } else if (
      !referencedSLPTemplate.Resources[ref.resource][KeywordSLPOutput]
    ) {
      errors.push(getError(`does not have ${KeywordSLPOutput}`));
    } else if (ref.attribute) {
      if (
        !referencedSLPTemplate.Resources[ref.resource][
          KeywordSLPOutput
        ].attributes.includes(ref.attribute)
      ) {
        errors.push(
          getError(
            `does not have attribute ${ref.attribute} in ${KeywordSLPOutput}`
          )
        );
      }
    } else {
      if (
        !referencedSLPTemplate.Resources[ref.resource][KeywordSLPOutput].default
      ) {
        errors.push(
          getError(`does not have default set to true in ${KeywordSLPOutput}`)
        );
      }
    }
  });

  return errors;
};
