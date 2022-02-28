import { childProcess } from "@sodaru/cli-base";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import {
  file_packageJson,
  path_build,
  path_functionLayers,
  path_serverless
} from "../../constants";
import {
  KeywordSLPFunctionLayerLibraries,
  KeywordSLPResourceName,
  ServerlessTemplate,
  SLPFunctionLayerLibraries,
  SLPTemplate
} from "../types";
import { getSLPKeyword, replaceSLPKeyword } from "../utils";

export const apply = (serverlessTemplate: ServerlessTemplate) => {
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSLPFunctionLayerLibraries].forEach(
      functionLayerLibrariesKeywordPath => {
        const functionLayerLibraries = getSLPKeyword<SLPFunctionLayerLibraries>(
          slpTemplate,
          functionLayerLibrariesKeywordPath
        ) as SLPFunctionLayerLibraries & {
          ContentUri: string;
        };

        const layerName =
          functionLayerLibraries.LayerName[KeywordSLPResourceName];

        functionLayerLibraries.ContentUri = `${slpTemplate.packageLocation}/${path_build}/${path_serverless}/${path_functionLayers}/${layerName}`;
        delete functionLayerLibraries[KeywordSLPFunctionLayerLibraries];

        replaceSLPKeyword(
          slpTemplate,
          functionLayerLibrariesKeywordPath,
          functionLayerLibraries
        );
      }
    );
  });
};

export const build = async (rootSLPTemplate: SLPTemplate): Promise<void> => {
  await Promise.all(
    rootSLPTemplate.keywordPaths[KeywordSLPFunctionLayerLibraries].map(
      async layerPaths => {
        const layer = getSLPKeyword<SLPFunctionLayerLibraries>(
          rootSLPTemplate,
          layerPaths
        );

        const layerName = layer.LayerName[KeywordSLPResourceName];
        const dependencies = layer[KeywordSLPFunctionLayerLibraries];

        const layerPackageJson = {
          name: rootSLPTemplate.module + "-" + layerName.toLowerCase(),
          version: "1.0.0",
          description: `Lambda function layer - ${layerName}`,
          dependencies
        };

        const layerPath = join(
          rootSLPTemplate.packageLocation,
          path_build,
          path_serverless,
          path_functionLayers,
          layerName,
          "nodejs"
        );

        await mkdir(layerPath, { recursive: true });
        await writeFile(
          join(layerPath, file_packageJson),
          JSON.stringify(layerPackageJson, null, 2)
        );

        await childProcess(
          layerPath,
          process.platform == "win32" ? "npm.cmd" : "npm",
          ["install"]
        );
      }
    )
  );
};
