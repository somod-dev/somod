import { unixStylePath } from "@sodaru/cli-base";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join, relative } from "path";
import {
  path_build,
  path_functions,
  path_lambdas,
  path_serverless,
  path_slpWorkingDir
} from "../../constants";
import {
  KeywordSLPFunction,
  ServerlessTemplate,
  SLPFunction,
  SLPTemplate
} from "../types";
import { getSLPKeyword, replaceSLPKeyword } from "../utils";

export const validate = (slpTemplate: SLPTemplate): Error[] => {
  const errors: Error[] = [];

  slpTemplate.keywordPaths[KeywordSLPFunction].forEach(functionKeywordPath => {
    const functionName = getSLPKeyword<SLPFunction>(
      slpTemplate,
      functionKeywordPath
    )[KeywordSLPFunction];

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

export const apply = (serverlessTemplate: ServerlessTemplate) => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSLPFunction].forEach(
      functionKeywordPath => {
        const functionName = getSLPKeyword<SLPFunction>(
          slpTemplate,
          functionKeywordPath
        )[KeywordSLPFunction];
        replaceSLPKeyword(
          slpTemplate,
          functionKeywordPath,
          `${path_slpWorkingDir}/${path_lambdas}/${slpTemplate.module}/${functionName}`
        );
      }
    );
  });
};

export const prepare = async (
  dir: string,
  serverlessTemplate: ServerlessTemplate
): Promise<void> => {
  await Promise.all(
    Object.values(serverlessTemplate).map(async slpTemplate => {
      await Promise.all(
        slpTemplate.keywordPaths[KeywordSLPFunction].map(
          async functionKeywordPath => {
            const functionName = getSLPKeyword<SLPFunction>(
              slpTemplate,
              functionKeywordPath
            )[KeywordSLPFunction];

            const functionPath = join(
              dir,
              path_slpWorkingDir,
              path_functions,
              slpTemplate.module,
              functionName + ".js"
            );
            const functionDir = dirname(functionPath);
            const exportFrom = slpTemplate.root
              ? relative(functionDir, join(dir, path_build))
                  .split("\\")
                  .join("/")
              : slpTemplate.module;

            const functionCode = `export { ${functionName} as default } from "${exportFrom}";`;
            await mkdir(functionDir, { recursive: true });
            await writeFile(functionPath, functionCode);
          }
        )
      );
    })
  );
};
