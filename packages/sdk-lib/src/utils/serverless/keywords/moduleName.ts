import {
  KeywordSOMODModuleName,
  ServerlessTemplate,
  SOMODModuleName
} from "../types";
import { getSOMODKeyword, replaceSOMODKeyword } from "../utils";

export const apply = (serverlessTemplate: ServerlessTemplate) => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSOMODModuleName].forEach(
      slpModuleNamePath => {
        const slpModuleName = getSOMODKeyword<SOMODModuleName>(
          slpTemplate,
          slpModuleNamePath
        )[KeywordSOMODModuleName];
        const resultStr = slpModuleName.replace(
          /\$\{SOMOD::ModuleName\}/g,
          slpTemplate.module
        );
        replaceSOMODKeyword(slpTemplate, slpModuleNamePath, resultStr);
      }
    );
  });
};
