import {
  KeywordSLPDependsOn,
  ServerlessTemplate,
  SLPDependsOn,
  SLPTemplate
} from "../types";
import { getSLPKeyword } from "./utils";

export const validate = (
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
): Error[] => {
  const errors: Error[] = [];
  slpTemplate.keywordPaths[KeywordSLPDependsOn].forEach(
    dependsOnKeywordPath => {
      const resourceId = dependsOnKeywordPath[dependsOnKeywordPath.length - 1];
      const dependsOn = getSLPKeyword<SLPDependsOn>(
        slpTemplate,
        dependsOnKeywordPath
      )[KeywordSLPDependsOn];
      dependsOn.forEach(_dependsOn => {
        const dependedModule =
          _dependsOn.module == slpTemplate.module
            ? slpTemplate
            : serverlessTemplate[_dependsOn.module];
        if (!dependedModule?.Resources[_dependsOn.resource]) {
          errors.push(
            new Error(
              `Dependent module resource {${_dependsOn.module}, ${_dependsOn.resource}} not found. Depended from {${slpTemplate.module}, ${resourceId}}`
            )
          );
        }
      });
    }
  );

  return errors;
};
