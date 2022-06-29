import { readJsonFileStore, unixStylePath } from "@solib/cli-base";
import { build as esbuild } from "esbuild";
import { existsSync } from "fs";
import { mkdir, readdir, writeFile } from "fs/promises";
import { cloneDeep } from "lodash";
import { dirname, join } from "path";
import {
  file_index_js,
  path_build,
  path_functions,
  path_serverless
} from "../../constants";
import {
  apply as applyBaseLayer,
  listLayerLibraries
} from "../baseModule/layers/baseLayer";
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
import { validate as jsonValidator } from "@solib/json-validator";
import { DataValidationError } from "@solib/errors";

export const validate = (slpTemplate: SLPTemplate): Error[] => {
  const errors: Error[] = [];

  slpTemplate.keywordPaths[KeywordSLPFunction].forEach(functionKeywordPath => {
    const _function = getSLPKeyword<SLPFunction>(
      slpTemplate,
      functionKeywordPath
    )[KeywordSLPFunction];

    /**
     * for root module look in <$packageLocation>/serverless/functions/<functionName>.ts
     * for child module look in <$packageLocation>/build/serverless/functions/<functionName>/index.js
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

export const validateCustomResourceSchema = (
  slpTemplate: SLPTemplate,
  serverlessTemplate: ServerlessTemplate
): Error[] => {
  const errors: Error[] = [];
  Object.keys(slpTemplate.Resources).forEach(logicalResourceId => {
    if (
      /^Custom::[A-Z][a-zA-Z0-9]{0,63}$/.test(
        slpTemplate.Resources[logicalResourceId].Type
      )
    ) {
      const customResource = cloneDeep(
        slpTemplate.original.Resources[logicalResourceId]
      );
      const customResourceType = customResource.Type.substring(
        "Custom::".length
      );
      const serviceToken = (customResource.Properties.ServiceToken as SLPRef)[
        KeywordSLPRef
      ];
      if (!serviceToken.module) {
        serviceToken.module = slpTemplate.module;
      }
      const customResourceFunctionSlpTemplate =
        serviceToken.module == slpTemplate.module
          ? slpTemplate
          : serverlessTemplate[serviceToken.module];

      if (customResourceFunctionSlpTemplate) {
        // else part is taken care by SLPRef validation
        const customResourceFunctionResource =
          customResourceFunctionSlpTemplate.original.Resources[
            serviceToken.resource
          ];
        if (customResourceFunctionResource) {
          // else part is taken care by SLPRef validation
          const schemaNotFoundError = new Error(
            `Schema not found for CustomResource ${logicalResourceId}. Looked at 'Properties.CodeUri.${KeywordSLPFunction}.customResources.${customResourceType}' in {${serviceToken.module}, ${serviceToken.resource}}`
          );
          const customResourceCodeUri = customResourceFunctionResource
            .Properties?.CodeUri as SLPFunction;
          if (customResourceCodeUri) {
            const customResourceSlpFunction =
              customResourceCodeUri[KeywordSLPFunction];
            if (customResourceSlpFunction) {
              const customResourceSchema =
                (customResourceSlpFunction.customResources || {})[
                  customResourceType
                ];
              if (customResourceSchema) {
                try {
                  delete customResource.Properties.ServiceToken;
                  jsonValidator(customResourceSchema, customResource);
                } catch (e) {
                  if (e instanceof DataValidationError) {
                    errors.push(
                      new Error(
                        `Custom Resource ${logicalResourceId} has following errors\n${e.violations
                          .map(v => " " + (v.path + " " + v.message).trim())
                          .join("\n")}`
                      )
                    );
                  } else {
                    throw e;
                  }
                }
              } else {
                errors.push(schemaNotFoundError);
              }
            } else {
              errors.push(schemaNotFoundError);
            }
          } else {
            errors.push(schemaNotFoundError);
          }
        }
      }
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
          unixStylePath(
            join(
              slpTemplate.packageLocation,
              path_build,
              path_serverless,
              path_functions,
              _function.name
            )
          )
        );

        const resourceId = functionKeywordPath[0];

        applyBaseLayer(slpTemplate, resourceId);
      }
    );
    if (slpTemplate.keywordPaths[KeywordSLPFunction].length > 0) {
      // refresh keyword paths after applying layers
      updateKeywordPathsInSLPTemplate(slpTemplate);
    }
  });
};

const file_excludeJson = "exclude.json";

export const build = async (rootSLPTemplate: SLPTemplate): Promise<void> => {
  const buildFunctionsPath = join(
    rootSLPTemplate.packageLocation,
    path_build,
    path_serverless,
    path_functions
  );
  await Promise.all(
    rootSLPTemplate.keywordPaths[KeywordSLPFunction].map(
      async functionPaths => {
        const _function = getSLPKeyword<SLPFunction>(
          rootSLPTemplate,
          functionPaths
        )[KeywordSLPFunction];
        const external = ["aws-sdk", ...(_function.exclude || [])];
        const baseLayerLibraries = await listLayerLibraries();
        external.push(...baseLayerLibraries);

        const excludeFilePath = join(
          buildFunctionsPath,
          _function.name,
          file_excludeJson
        );
        const excludeFileDir = dirname(excludeFilePath);
        await mkdir(excludeFileDir, { recursive: true });
        await writeFile(excludeFilePath, JSON.stringify({ external }));
      }
    )
  );
};

export const bundle = async (dir: string): Promise<void> => {
  const srcFunctionsPath = join(dir, path_serverless, path_functions);
  const buildFunctionsPath = join(
    dir,
    path_build,
    path_serverless,
    path_functions
  );
  if (existsSync(srcFunctionsPath)) {
    const functions = await readdir(srcFunctionsPath);
    await Promise.all(
      functions.map(async functionFileName => {
        const functionName = functionFileName.substring(
          0,
          functionFileName.length - 3
        );

        const exclude = await readJsonFileStore(
          join(buildFunctionsPath, functionName, file_excludeJson)
        );

        await esbuild({
          entryPoints: [join(srcFunctionsPath, functionFileName)],
          bundle: true,
          outfile: join(buildFunctionsPath, functionName, file_index_js),
          sourcemap: false,
          platform: "node",
          external: exclude.external as string[],
          minify: true,
          target: ["node16"]
        });
      })
    );
  }
};
