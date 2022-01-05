import { cloneDeep, isArray, mergeWith } from "lodash";
import {
  KeywordSLPExtend,
  ServerlessTemplate,
  SLPExtend,
  SLPResource,
  SLPTemplate
} from "../types";
import { getSLPKeyword } from "./utils";

export const validate = (
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
): Error[] => {
  const errors: Error[] = [];
  slpTemplate.keywordPaths[KeywordSLPExtend].forEach(extendKeywordPath => {
    const resourceId = extendKeywordPath[extendKeywordPath.length - 1];
    const extend = getSLPKeyword<SLPExtend>(slpTemplate, extendKeywordPath)[
      KeywordSLPExtend
    ];
    if (!serverlessTemplate[extend.module]?.Resources[extend.resource]) {
      errors.push(
        new Error(
          `Extended module resource {${extend.module}, ${extend.resource}} not found. Extended in {${slpTemplate.module}, ${resourceId}}`
        )
      );
    }
  });

  return errors;
};

export const apply = (
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
): void => {
  slpTemplate.keywordPaths[KeywordSLPExtend].forEach(extendKeywordPath => {
    const extendedResource = getSLPKeyword<SLPExtend>(
      slpTemplate,
      extendKeywordPath
    ) as SLPResource;

    const extend = extendedResource[KeywordSLPExtend];

    const extendChain = [extend];

    while (extendChain.length > 0) {
      const _extend = extendChain.shift();

      const targetTemplate = serverlessTemplate[_extend.module];
      const source =
        targetTemplate.extendedResources[_extend.resource] ||
        targetTemplate.Resources[_extend.resource];

      const sourceResource = cloneDeep(source);

      targetTemplate.extendedResources[_extend.resource] = mergeWith(
        sourceResource,
        extendedResource,
        (objValue, srcValue) => {
          if (isArray(objValue)) {
            return objValue.concat(srcValue);
          }
        }
      );

      if (targetTemplate[_extend.resource][KeywordSLPExtend]) {
        extendChain.push(targetTemplate[_extend.resource][KeywordSLPExtend]);
      }
    }
  });
};
