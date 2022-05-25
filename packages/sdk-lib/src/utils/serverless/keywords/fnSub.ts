import { isArray } from "lodash";
import { FnSub, KeywordFnSub, ServerlessTemplate } from "../types";
import { getSLPKeyword, replaceSLPKeyword } from "../utils";

export const apply = (serverlessTemplate: ServerlessTemplate) => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordFnSub].forEach(fnSubPath => {
      let fnSub = getSLPKeyword<FnSub>(slpTemplate, fnSubPath)[KeywordFnSub];
      if (typeof fnSub == "string") {
        fnSub = fnSub.replace(/\$\{SLP::ModuleName\}/g, slpTemplate.module);
      } else if (isArray(fnSub)) {
        fnSub[0] = fnSub[0].replace(
          /\$\{SLP::ModuleName\}/g,
          slpTemplate.module
        );
      }
      replaceSLPKeyword(slpTemplate, fnSubPath, { [KeywordFnSub]: fnSub });
    });
  });
};
