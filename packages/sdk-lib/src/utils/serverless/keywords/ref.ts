import { getKeyword, getKeywordPaths } from "../../keywords";
import {
  KeywordSLPExtend,
  KeywordSLPOutput,
  KeywordSLPRef,
  ServerlessTemplate,
  SLPRef,
  SLPTemplate
} from "../types";
import {
  getSAMResourceLogicalId,
  getSLPKeyword,
  replaceSLPKeyword
} from "../utils";
import { checkAccess } from "./access";

export const validate = (
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
): Error[] => {
  const errors: Error[] = [];

  slpTemplate.keywordPaths[KeywordSLPRef].forEach(refKeywordPath => {
    const ref = getSLPKeyword<SLPRef>(slpTemplate, refKeywordPath)[
      KeywordSLPRef
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
        if (referencedSLPTemplate.Resources[ref.resource][KeywordSLPExtend]) {
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
            !referencedSLPTemplate.Resources[ref.resource][KeywordSLPOutput]
              .default
          ) {
            errors.push(
              getError(
                `does not have default set to true in ${KeywordSLPOutput}`
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
    slpTemplate.keywordPaths[KeywordSLPRef].forEach(refPath => {
      const ref = getSLPKeyword<SLPRef>(slpTemplate, refPath)[KeywordSLPRef];
      const resourceId = getSAMResourceLogicalId(
        ref.module || slpTemplate.module,
        ref.resource
      );
      const refValue = ref.attribute
        ? { "Fn::GetAtt": [resourceId, ref.attribute] }
        : { Ref: resourceId };
      replaceSLPKeyword(slpTemplate, refPath, refValue);
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
