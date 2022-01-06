import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import {
  file_packageJson,
  path_lambda_layers,
  path_slpWorkingDir
} from "../../constants";
import {
  KeywordSLPFunctionLayerLibraries,
  KeywordSLPResourceName,
  ServerlessTemplate,
  SLPFunctionLayerLibraries
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

        functionLayerLibraries.ContentUri = `${path_slpWorkingDir}/${path_lambda_layers}/${slpTemplate.module}/${layerName}`;
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

export const prepare = async (
  dir: string,
  serverlessTemplate: ServerlessTemplate
): Promise<void> => {
  await Promise.all(
    Object.values(serverlessTemplate).map(async slpTemplate => {
      await Promise.all(
        slpTemplate.keywordPaths[KeywordSLPFunctionLayerLibraries].map(
          async functionLayerLibrariesKeywordPath => {
            const functionLayerLibraries =
              getSLPKeyword<SLPFunctionLayerLibraries>(
                slpTemplate,
                functionLayerLibrariesKeywordPath
              );

            const layerName =
              functionLayerLibraries.LayerName[KeywordSLPResourceName];
            const dependencies =
              functionLayerLibraries[KeywordSLPFunctionLayerLibraries];

            const layerPackageJson = {
              name: slpTemplate.module + "-" + layerName.toLowerCase(),
              version: "1.0.0",
              description: `Lambda function layer - ${layerName}`,
              dependencies
            };

            const layerPackageJsonPath = join(
              dir,
              path_slpWorkingDir,
              path_lambda_layers,
              slpTemplate.module,
              layerName,
              file_packageJson
            );

            const destDir = dirname(layerPackageJsonPath);
            await mkdir(destDir, { recursive: true });
            await writeFile(
              layerPackageJsonPath,
              JSON.stringify(layerPackageJson, null, 2)
            );
          }
        )
      );
    })
  );
};
