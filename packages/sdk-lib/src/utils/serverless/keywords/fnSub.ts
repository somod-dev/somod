import { isArray } from "lodash";
import { FnSub, KeywordFnSub, ServerlessTemplate } from "../types";
import { getSOMODKeyword, replaceSOMODKeyword } from "../utils";

export const apply = (serverlessTemplate: ServerlessTemplate) => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordFnSub].forEach(fnSubPath => {
      let fnSub = getSOMODKeyword<FnSub>(slpTemplate, fnSubPath)[KeywordFnSub];
      if (typeof fnSub == "string") {
        fnSub = fnSub.replace(/\$\{SOMOD::ModuleName\}/g, slpTemplate.module);
      } else if (isArray(fnSub)) {
        fnSub[0] = fnSub[0].replace(
          /\$\{SOMOD::ModuleName\}/g,
          slpTemplate.module
        );
      }
      replaceSOMODKeyword(slpTemplate, fnSubPath, { [KeywordFnSub]: fnSub });
    });
  });
};
