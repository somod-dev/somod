import {
  KeywordSLPRefResourceName,
  KeywordSLPResourceName,
  ServerlessTemplate,
  SLPRefResourceName,
  SLPTemplate
} from "../types";
import { getSLPKeyword } from "./utils";

export const validate = (
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
): Error[] => {
  const errors: Error[] = [];

  slpTemplate.keywordPaths[KeywordSLPRefResourceName].forEach(
    refResourceNameKeywordPath => {
      const refResourceName = getSLPKeyword<SLPRefResourceName>(
        slpTemplate,
        refResourceNameKeywordPath
      )[KeywordSLPRefResourceName];

      const referencedSLPTemplate =
        refResourceName.module == slpTemplate.module
          ? slpTemplate
          : serverlessTemplate[refResourceName.module];

      if (
        !(
          referencedSLPTemplate?.Resources &&
          referencedSLPTemplate.Resources[refResourceName.resource]
            ?.Properties &&
          referencedSLPTemplate.Resources[refResourceName.resource].Properties[
            refResourceName.property
          ]
        )
      ) {
        errors.push(
          new Error(
            `Referenced module resource name {${refResourceName.module}, ${
              refResourceName.resource
            }, ${refResourceName.property}} not found. Referenced in "${
              slpTemplate.module
            }" at "Resources/${refResourceNameKeywordPath.join("/")}"`
          )
        );
      } else if (
        !referencedSLPTemplate.Resources[refResourceName.resource].Properties[
          refResourceName.property
        ][KeywordSLPResourceName]
      ) {
        errors.push(
          new Error(
            `Referenced module resource name property {${
              refResourceName.module
            }, ${refResourceName.resource}, ${
              refResourceName.property
            }} is not a valid ${KeywordSLPResourceName}. Referenced in "${
              slpTemplate.module
            }" at "Resources/${refResourceNameKeywordPath.join("/")}"`
          )
        );
      }
    }
  );

  return errors;
};
