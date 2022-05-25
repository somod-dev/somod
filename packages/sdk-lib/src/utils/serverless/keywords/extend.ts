import { merge } from "lodash";
import {
  KeywordSLPExtend,
  ServerlessTemplate,
  SLPExtend,
  SLPTemplate
} from "../types";
import { getSLPKeyword } from "../utils";
import { checkAccess } from "./access";

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
    } else {
      errors.push(
        ...checkAccess(
          slpTemplate.module,
          extendKeywordPath,
          extend.resource,
          serverlessTemplate[extend.module]
        )
      );
    }
  });

  return errors;
};

export const apply = (serverlessTemplate: ServerlessTemplate): void => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSLPExtend].forEach(extendKeywordPath => {
      const resourceId = extendKeywordPath[0]; // SLP::Extend is used as Resource attribute only
      const extendedResource = slpTemplate.Resources[resourceId];

      let extend = extendedResource[KeywordSLPExtend];
      delete extendedResource[KeywordSLPExtend];

      while (
        serverlessTemplate[extend.module].original.Resources[extend.resource][
          KeywordSLPExtend
        ]
      ) {
        extend =
          serverlessTemplate[extend.module].original.Resources[extend.resource][
            KeywordSLPExtend
          ];
      }

      serverlessTemplate[extend.module].Resources[extend.resource] = merge(
        serverlessTemplate[extend.module].Resources[extend.resource],
        extendedResource
      );
    });
  });
};
