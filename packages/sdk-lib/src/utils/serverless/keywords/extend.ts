import { merge } from "lodash";
import {
  KeywordSOMODExtend,
  ServerlessTemplate,
  SOMODExtend,
  SLPTemplate
} from "../types";
import { getSOMODKeyword } from "../utils";
import { checkAccess } from "./access";

export const validate = (
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
): Error[] => {
  const errors: Error[] = [];
  slpTemplate.keywordPaths[KeywordSOMODExtend].forEach(extendKeywordPath => {
    const resourceId = extendKeywordPath[extendKeywordPath.length - 1];
    const extend = getSOMODKeyword<SOMODExtend>(slpTemplate, extendKeywordPath)[
      KeywordSOMODExtend
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
    slpTemplate.keywordPaths[KeywordSOMODExtend].forEach(extendKeywordPath => {
      const resourceId = extendKeywordPath[0]; // SOMOD::Extend is used as Resource attribute only
      const extendedResource = slpTemplate.Resources[resourceId];

      let extend = extendedResource[KeywordSOMODExtend];
      delete extendedResource[KeywordSOMODExtend];

      while (
        serverlessTemplate[extend.module].original.Resources[extend.resource][
          KeywordSOMODExtend
        ]
      ) {
        extend =
          serverlessTemplate[extend.module].original.Resources[extend.resource][
            KeywordSOMODExtend
          ];
      }

      serverlessTemplate[extend.module].Resources[extend.resource] = merge(
        serverlessTemplate[extend.module].Resources[extend.resource],
        extendedResource
      );
    });
  });
};
