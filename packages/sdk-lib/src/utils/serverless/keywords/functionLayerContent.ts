import { unixStylePath } from "@solib/cli-base";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import {
  path_build,
  path_functionLayers,
  path_serverless
} from "../../constants";
import {
  KeywordSOMODFunctionLayerContent,
  KeywordSOMODFunctionLayerLibraries,
  KeywordSOMODResourceName,
  ServerlessTemplate,
  SOMODFunctionLayerContent
} from "../types";
import { getSOMODKeyword, replaceSOMODKeyword } from "../utils";

export const apply = async (serverlessTemplate: ServerlessTemplate) => {
  const fileContent: Record<string, string> = {};
  Object.values(serverlessTemplate).forEach(slpTemplate => {
    slpTemplate.keywordPaths[KeywordSOMODFunctionLayerContent].forEach(
      functionLayerContentKeywordPath => {
        const functionLayerContent = getSOMODKeyword<SOMODFunctionLayerContent>(
          slpTemplate,
          functionLayerContentKeywordPath
        ) as SOMODFunctionLayerContent & {
          ContentUri: string;
        };

        const layerName =
          functionLayerContent.LayerName[KeywordSOMODResourceName];

        Object.keys(
          functionLayerContent[KeywordSOMODFunctionLayerContent]
        ).forEach(layerContentPath => {
          fileContent[
            join(
              slpTemplate.packageLocation,
              path_build,
              path_serverless,
              path_functionLayers,
              layerName,
              layerContentPath
            )
          ] =
            functionLayerContent[KeywordSOMODFunctionLayerContent][
              layerContentPath
            ];
        });

        functionLayerContent.ContentUri = `${unixStylePath(
          slpTemplate.packageLocation
        )}/${path_build}/${path_serverless}/${path_functionLayers}/${layerName}`;
        delete functionLayerContent[KeywordSOMODFunctionLayerContent];
        delete functionLayerContent[KeywordSOMODFunctionLayerLibraries];

        replaceSOMODKeyword(
          slpTemplate,
          functionLayerContentKeywordPath,
          functionLayerContent
        );
      }
    );
  });

  await Promise.all(
    Object.keys(fileContent).map(async filePath => {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, fileContent[filePath]);
    })
  );
};
