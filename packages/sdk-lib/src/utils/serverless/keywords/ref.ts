import { getKeyword, getKeywordPaths } from "../../keywords";
import {
  KeywordSOMODExtend,
  KeywordSOMODOutput,
  KeywordSOMODRef,
  ServerlessTemplate,
  SOMODRef,
  SLPTemplate
} from "../types";
import {
  getSAMResourceLogicalId,
  getSOMODKeyword,
  replaceSOMODKeyword
} from "../utils";
import { checkAccess } from "./access";

export const validate = (
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
): Error[] => {
  const errors: Error[] = [];

  slpTemplate.keywordPaths[KeywordSOMODRef].forEach(refKeywordPath => {
    const ref = getSOMODKeyword<SOMODRef>(slpTemplate, refKeywordPath)[
      KeywordSOMODRef
    ];
    if (!ref.module) {
      ref.module = slpTemplate.module;
    }
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
    } else {
      const accessErrors = checkAccess(
        slpTemplate.module,
        refKeywordPath,
        ref.resource,
        referencedSLPTemplate
      );
      if (accessErrors.length > 0) {
        errors.push(...accessErrors);
      } else {
        if (referencedSLPTemplate.Resources[ref.resource][KeywordSOMODExtend]) {
          errors.push(getError(`must not have ${KeywordSOMODExtend}`));
        } else if (
          !referencedSLPTemplate.Resources[ref.resource][KeywordSOMODOutput]
        ) {
          errors.push(getError(`does not have ${KeywordSOMODOutput}`));
        } else if (ref.attribute) {
          if (
            !referencedSLPTemplate.Resources[ref.resource][
              KeywordSOMODOutput
            ].attributes.includes(ref.attribute)
          ) {
            errors.push(
              getError(
                `does not have attribute ${ref.attribute} in ${KeywordSOMODOutput}`
              )
            );
          }
        } else {
          if (
            !referencedSLPTemplate.Resources[ref.resource][KeywordSOMODOutput]
              .default
          ) {
            errors.push(
              getError(
                `does not have default set to true in ${KeywordSOMODOutput}`
              )
            );
          }
        }
      }
    }
  });

  return errors;
};

export const apply = (serverlessTemplate: ServerlessTemplate) => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSOMODRef].forEach(refPath => {
      const ref = getSOMODKeyword<SOMODRef>(slpTemplate, refPath)[
        KeywordSOMODRef
      ];
      const resourceId = getSAMResourceLogicalId(
        ref.module || slpTemplate.module,
        ref.resource
      );
      const refValue = ref.attribute
        ? { "Fn::GetAtt": [resourceId, ref.attribute] }
        : { Ref: resourceId };
      replaceSOMODKeyword(slpTemplate, refPath, refValue);
    });
  });
};

/**
 * Checks if the given resource is referenced in ServerlessTemplate
 *
 * This method checks for occurances of `Fn::GetAtt` and `Ref`, so this method needs to be called after applying all keywords
 */
export const isReferenced = (
  serverlessTemplate: ServerlessTemplate,
  module: string,
  resource: string,
  attribute?: string
): boolean => {
  const dataToSearchFor = Object.fromEntries(
    Object.keys(serverlessTemplate).map(moduleName => [
      moduleName,
      { Resources: serverlessTemplate[moduleName].Resources }
    ])
  );

  const samResourceLogicalId = getSAMResourceLogicalId(module, resource);

  const refPaths = getKeywordPaths(dataToSearchFor, ["Ref"]);

  for (const refPath of refPaths["Ref"]) {
    const ref = getKeyword(dataToSearchFor, refPath)["Ref"] as string;
    if (ref == samResourceLogicalId) {
      return true;
    }
  }

  const getAttPaths = getKeywordPaths(dataToSearchFor, ["Fn::GetAtt"]);
  for (const getAttPath of getAttPaths["Fn::GetAtt"]) {
    const ref = getKeyword(dataToSearchFor, getAttPath)[
      "Fn::GetAtt"
    ] as string[];
    if (ref[0] == samResourceLogicalId && (!attribute || ref[1] == attribute)) {
      return true;
    }
  }

  return false;
};
