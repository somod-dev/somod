import {
  KeywordSOMODResourceName,
  ServerlessTemplate,
  SOMODResourceName
} from "../types";
import {
  getSAMResourceName,
  getSOMODKeyword,
  replaceSOMODKeyword
} from "../utils";

export const apply = (serverlessTemplate: ServerlessTemplate) => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSOMODResourceName].forEach(
      resourceNamePath => {
        const resourceName = getSOMODKeyword<SOMODResourceName>(
          slpTemplate,
          resourceNamePath
        )[KeywordSOMODResourceName];
        replaceSOMODKeyword(
          slpTemplate,
          resourceNamePath,
          getSAMResourceName(slpTemplate.module, resourceName)
        );
      }
    );
  });
};
