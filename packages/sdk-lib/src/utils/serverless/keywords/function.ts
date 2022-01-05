import { unixStylePath } from "@sodaru/cli-base";
import { existsSync } from "fs";
import { join } from "path";
import { path_build, path_functions, path_serverless } from "../../constants";
import { KeywordSLPFunction, SLPFunction, SLPTemplate } from "../types";
import { getSLPKeyword } from "./utils";

export const validate = (slpTemplate: SLPTemplate): Error[] => {
  const errors: Error[] = [];

  slpTemplate.keywordPaths[KeywordSLPFunction].forEach(functionKeywordPath => {
    const slpFunction = getSLPKeyword<SLPFunction>(
      slpTemplate,
      functionKeywordPath
    )[KeywordSLPFunction];

    const functionName = slpFunction.function;

    /**
     * for root module look in serverless/functions/<functionName>.ts
     * for child module look in build/serverless/functions/<functionName>.js
     */
    let functionFilePath = slpTemplate.packageLocation;
    if (!slpTemplate.root) {
      functionFilePath = join(functionFilePath, path_build);
    }
    functionFilePath = join(
      functionFilePath,
      path_serverless,
      path_functions,
      functionName + (slpTemplate.root ? ".ts" : ".js")
    );

    if (!existsSync(functionFilePath)) {
      errors.push(
        new Error(
          `Referenced module function {${
            slpTemplate.module
          }, ${functionName}} not found. Looked for file "${unixStylePath(
            functionFilePath
          )}". Referenced in "${
            slpTemplate.module
          }" at "Resources/${functionKeywordPath.join("/")}"`
        )
      );
    }
  });

  return errors;
};
