import { unixStylePath } from "@sodaru/cli-base";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { cloneDeep } from "lodash";
import { dirname, join, relative } from "path";
import {
  file_lambdaBundleExclude,
  path_build,
  path_functions,
  path_lambdas,
  path_serverless,
  path_slpWorkingDir
} from "../../constants";
import { baseLayerName, baseModuleName } from "../slpTemplate";
import {
  KeywordSLPFunction,
  KeywordSLPRef,
  ServerlessTemplate,
  SLPFunction,
  SLPRef,
  SLPTemplate
} from "../types";
import {
  getSLPKeyword,
  replaceSLPKeyword,
  updateKeywordPathsInSLPTemplate
} from "../utils";

export const validate = (slpTemplate: SLPTemplate): Error[] => {
  const errors: Error[] = [];

  slpTemplate.keywordPaths[KeywordSLPFunction].forEach(functionKeywordPath => {
    const _function = getSLPKeyword<SLPFunction>(
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
      _function.name + (slpTemplate.root ? ".ts" : ".js")
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

const applyBaseLayer = (slpTemplate: SLPTemplate, resourceId: string) => {
  const layers = (slpTemplate.Resources[resourceId].Properties.Layers ||
    []) as SLPRef[];
  layers.unshift({
    [KeywordSLPRef]: { module: baseModuleName, resource: baseLayerName }
  });
  slpTemplate.Resources[resourceId].Properties.Layers = layers;
  slpTemplate.original.Resources[resourceId].Properties.Layers = layers;
};

export const apply = (serverlessTemplate: ServerlessTemplate) => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSLPFunction].forEach(
      functionKeywordPath => {
        const _functionName = getSLPKeyword<SLPFunction>(
          slpTemplate,
          functionKeywordPath
        )[KeywordSLPFunction];
        replaceSLPKeyword(
          slpTemplate,
          functionKeywordPath,
          `${path_slpWorkingDir}/${path_lambdas}/${slpTemplate.module}/${_functionName.name}`
        );

        const resourceId = functionKeywordPath[0];
        applyBaseLayer(slpTemplate, resourceId);
      }
    );
    if (slpTemplate.keywordPaths[KeywordSLPFunction].length > 0) {
      const functionKeywordPaths = cloneDeep(
        slpTemplate.keywordPaths[KeywordSLPFunction]
      );
      updateKeywordPathsInSLPTemplate(slpTemplate);
      slpTemplate.keywordPaths[KeywordSLPFunction] = functionKeywordPaths;
    }
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
            const { name: functionName } = getSLPKeyword<SLPFunction>(
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

  await saveExcludes(dir, serverlessTemplate);
};

const saveExcludes = async (
  dir: string,
  serverlessTemplate: ServerlessTemplate
): Promise<void> => {
  const excludes: Record<string, Record<string, string[]>> = {};

  Object.values(serverlessTemplate).forEach(slpTemplate => {
    excludes[slpTemplate.module] = {};
    slpTemplate.keywordPaths[KeywordSLPFunction].forEach(
      functionKeywordPath => {
        const _function = getSLPKeyword<SLPFunction>(
          slpTemplate,
          functionKeywordPath
        )[KeywordSLPFunction];

        excludes[slpTemplate.module][_function.name] = _function.exclude || [];
      }
    );
  });

  await mkdir(join(dir, path_slpWorkingDir), { recursive: true });

  await writeFile(
    join(dir, path_slpWorkingDir, file_lambdaBundleExclude),
    JSON.stringify(excludes)
  );
};
