import {
  KeywordSLPModuleName,
  ServerlessTemplate,
  SLPModuleName
} from "../types";
import { getSLPKeyword, replaceSLPKeyword } from "../utils";

export const apply = (serverlessTemplate: ServerlessTemplate) => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSLPModuleName].forEach(
      slpModuleNamePath => {
        const slpModuleName = getSLPKeyword<SLPModuleName>(
          slpTemplate,
          slpModuleNamePath
        )[KeywordSLPModuleName];
        const resultStr = slpModuleName.replace(
          /\$\{SLP::ModuleName\}/g,
          slpTemplate.module
        );
        replaceSLPKeyword(slpTemplate, slpModuleNamePath, resultStr);
      }
    );
  });
};
