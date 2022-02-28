import { unixStylePath } from "@sodaru/cli-base";
import { build as esbuild } from "esbuild";
import { existsSync } from "fs";
import { join } from "path";
import {
  file_index_js,
  path_build,
  path_functions,
  path_serverless
} from "../../constants";
import { apply as applyBaseLayer } from "../baseModule/layers/baseLayer";
import { apply as applyCustomResourceLayer } from "../baseModule/layers/customResourceLayer";
import {
  KeywordSLPFunction,
  ServerlessTemplate,
  SLPFunction,
  SLPTemplate
} from "../types";
import {
  getSLPKeyword,
  replaceSLPKeyword,
  updateKeywordPathsInSLPTemplate
} from "../utils";
import { layerLibraries } from "@somod/common-layers";

export const validate = (slpTemplate: SLPTemplate): Error[] => {
  const errors: Error[] = [];

  slpTemplate.keywordPaths[KeywordSLPFunction].forEach(functionKeywordPath => {
    const _function = getSLPKeyword<SLPFunction>(
      slpTemplate,
      functionKeywordPath
    )[KeywordSLPFunction];

    /**
     * for root module look in serverless/functions/<functionName>.ts
     * for child module look in build/serverless/functions/<functionName>/index.js
     */
    let functionFilePath = slpTemplate.packageLocation;
    if (!slpTemplate.root) {
      functionFilePath = join(functionFilePath, path_build);
    }
    functionFilePath = join(
      functionFilePath,
      path_serverless,
      path_functions,
      _function.name + (slpTemplate.root ? ".ts" : "/index.js")
    );

    if (!existsSync(functionFilePath)) {
      errors.push(
        new Error(
          `Referenced module function {${slpTemplate.module}, ${
            _function.name
          }} not found. Looked for file "${unixStylePath(
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
        const _function = getSLPKeyword<SLPFunction>(
          slpTemplate,
          functionKeywordPath
        )[KeywordSLPFunction];
        replaceSLPKeyword(
          slpTemplate,
          functionKeywordPath,
          `${slpTemplate.packageLocation}/${path_build}/${path_serverless}/${path_functions}/${_function.name}`
        );

        const resourceId = functionKeywordPath[0];
        if (_function.customResourceHandler) {
          applyCustomResourceLayer(slpTemplate, resourceId);
        }
        applyBaseLayer(slpTemplate, resourceId);
      }
    );
    if (slpTemplate.keywordPaths[KeywordSLPFunction].length > 0) {
      // refresh keyword paths after applying layers
      updateKeywordPathsInSLPTemplate(slpTemplate);
    }
  });
};

export const build = async (rootSLPTemplate: SLPTemplate): Promise<void> => {
  await Promise.all(
    rootSLPTemplate.keywordPaths[KeywordSLPFunction].map(
      async functionPaths => {
        const _function = getSLPKeyword<SLPFunction>(
          rootSLPTemplate,
          functionPaths
        )[KeywordSLPFunction];
        const external = _function.exclude || [];
        external.push(...layerLibraries.base);
        if (_function.customResourceHandler) {
          external.push(...layerLibraries.customResource);
        }

        await esbuild({
          entryPoints: [
            join(
              rootSLPTemplate.packageLocation,
              path_serverless,
              path_functions,
              _function.name + ".ts"
            )
          ],
          bundle: true,
          outfile: join(
            rootSLPTemplate.packageLocation,
            path_build,
            path_serverless,
            path_functions,
            _function.name,
            file_index_js
          ),
          sourcemap: false,
          platform: "node",
          external: external,
          minify: true,
          target: ["node14"]
        });
      }
    )
  );
};
