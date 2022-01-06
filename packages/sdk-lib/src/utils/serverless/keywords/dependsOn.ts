import {
  KeywordSLPDependsOn,
  SAMTemplate,
  ServerlessTemplate,
  SLPDependsOn,
  SLPTemplate
} from "../types";
import { getSAMResourceLogicalId, getSLPKeyword } from "../utils";

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
        if (!_dependsOn.module) {
          _dependsOn.module = slpTemplate.module;
        }
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

export const apply = (serverlessTemplate: ServerlessTemplate) => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSLPDependsOn].forEach(dependsOnPath => {
      const resourceId = dependsOnPath[0]; // dependsOn is always applied as Resource Property

      const dependsOn = getSLPKeyword<SLPDependsOn>(slpTemplate, dependsOnPath)[
        KeywordSLPDependsOn
      ];

      const dependsOnValue = dependsOn.map(_dependsOn =>
        getSAMResourceLogicalId(
          _dependsOn.module || slpTemplate.module,
          _dependsOn.resource
        )
      );

      (
        slpTemplate.Resources[resourceId] as SAMTemplate["Resources"][string]
      ).DependsOn = dependsOnValue;
      delete slpTemplate.Resources[resourceId][KeywordSLPDependsOn];
    });
  });
};
