import { KeywordSLPOutput, ServerlessTemplate } from "../types";

export const apply = (serverlessTemplate: ServerlessTemplate) => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSLPOutput].forEach(outputPath => {
      const resourceId = outputPath[0];
      delete slpTemplate.Resources[resourceId][KeywordSLPOutput];
    });
  });
};
