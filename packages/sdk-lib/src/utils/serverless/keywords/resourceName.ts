import {
  KeywordSLPResourceName,
  ServerlessTemplate,
  SLPResourceName
} from "../types";
import { getSAMResourceName, getSLPKeyword, replaceSLPKeyword } from "../utils";

export const apply = (serverlessTemplate: ServerlessTemplate) => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSLPResourceName].forEach(
      resourceNamePath => {
        const resourceName = getSLPKeyword<SLPResourceName>(
          slpTemplate,
          resourceNamePath
        )[KeywordSLPResourceName];
        replaceSLPKeyword(
          slpTemplate,
          resourceNamePath,
          getSAMResourceName(slpTemplate.module, resourceName)
        );
      }
    );
  });
};
