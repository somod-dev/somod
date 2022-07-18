import {
  KeywordSOMODRefResourceName,
  KeywordSOMODResourceName,
  ServerlessTemplate,
  SOMODRefResourceName,
  SLPTemplate
} from "../types";
import { getSOMODKeyword, replaceSOMODKeyword } from "../utils";
import { checkAccess } from "./access";

export const validate = (
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
): Error[] => {
  const errors: Error[] = [];

  slpTemplate.keywordPaths[KeywordSOMODRefResourceName].forEach(
    refResourceNameKeywordPath => {
      const refResourceName = getSOMODKeyword<SOMODRefResourceName>(
        slpTemplate,
        refResourceNameKeywordPath
      )[KeywordSOMODRefResourceName];

      if (!refResourceName.module) {
        refResourceName.module = slpTemplate.module;
      }

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
      } else {
        const accessErrors = checkAccess(
          slpTemplate.module,
          refResourceNameKeywordPath,
          refResourceName.resource,
          referencedSLPTemplate
        );

        if (accessErrors.length > 0) {
          errors.push(...accessErrors);
        } else if (
          !referencedSLPTemplate.Resources[refResourceName.resource].Properties[
            refResourceName.property
          ][KeywordSOMODResourceName]
        ) {
          errors.push(
            new Error(
              `Referenced module resource name property {${
                refResourceName.module
              }, ${refResourceName.resource}, ${
                refResourceName.property
              }} is not a valid ${KeywordSOMODResourceName}. Referenced in "${
                slpTemplate.module
              }" at "Resources/${refResourceNameKeywordPath.join("/")}"`
            )
          );
        }
      }
    }
  );

  return errors;
};

export const apply = (serverlessTemplate: ServerlessTemplate): void => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSOMODRefResourceName].forEach(
      refResourceNameKeywordPath => {
        const refResourceName = getSOMODKeyword<SOMODRefResourceName>(
          slpTemplate,
          refResourceNameKeywordPath
        )[KeywordSOMODRefResourceName];
        if (!refResourceName.module) {
          refResourceName.module = slpTemplate.module;
        }
        replaceSOMODKeyword(
          slpTemplate,
          refResourceNameKeywordPath,
          serverlessTemplate[refResourceName.module].Resources[
            refResourceName.resource
          ].Properties[refResourceName.property]
        );
      }
    );
  });
};
