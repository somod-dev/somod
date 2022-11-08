import { readJsonFileStore, unixStylePath } from "nodejs-file-utils";
import {
  JSONObjectNode,
  JSONPrimitiveNode,
  KeywordDefinition,
  ServerlessTemplate
} from "somod-types";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import {
  file_packageJson,
  path_functionLayers,
  path_serverless,
  path_somodWorkingDir,
  resourceType_FunctionLayer
} from "../../constants";
import { getPath } from "../../jsonTemplate";

type FunctionLayerType = {
  name: string;
  libraries?: string[];
  content?: Record<string, string>;
};

export const keywordFunctionLayer: KeywordDefinition<FunctionLayerType> = {
  keyword: "SOMOD::FunctionLayer",

  getValidator: async rootDir => {
    const modulePackageJsonPath = join(rootDir, file_packageJson);
    const modulePackageJson = await readJsonFileStore(modulePackageJsonPath);
    const moduleDevDependencies = modulePackageJson.devDependencies || {};

    return (keyword, node, value) => {
      const errors: Error[] = [];

      const path = getPath(node);
      if (
        !(
          path.length == 4 &&
          path[0] == "Resources" &&
          path[2] == "Properties" &&
          path[3] == "ContentUri" &&
          (
            (node.parent.node.parent.node as JSONObjectNode).properties
              ?.Type as JSONPrimitiveNode
          ).value == resourceType_FunctionLayer
        )
      ) {
        errors.push(
          new Error(
            `${keyword} is allowed only as value of ContentUri property of ${resourceType_FunctionLayer} resource`
          )
        );
      }

      //NOTE: structure of the value is validated by serverless-schema

      value.libraries?.forEach(library => {
        if (moduleDevDependencies[library] === undefined) {
          errors.push(
            new Error(
              `${library} required in layer ${value.name} does not exist in ${modulePackageJsonPath} as dev dependency`
            )
          );
        }
      });

      return errors;
    };
  },

  getProcessor: async (rootDir, moduleName) => (keyword, node, value) => {
    const functionLayerPath = join(
      rootDir,
      path_somodWorkingDir,
      path_serverless,
      path_functionLayers,
      moduleName,
      value.name
    );

    overrideLayerContent(rootDir, moduleName, value.name, value.content || {});

    return {
      type: "object",
      value: unixStylePath(functionLayerPath)
    };
  }
};

export const getLibrariesFromFunctionLayerResource = (
  resource: ServerlessTemplate["Resources"][string]
) => {
  const layer = resource.Properties.ContentUri?.[
    keywordFunctionLayer.keyword
  ] as FunctionLayerType;
  return layer?.libraries || [];
};

export const getFunctionLayerLibraries = (
  serverlessTemplate: ServerlessTemplate
) => {
  const libraries: Record<string, string[]> = {};
  Object.values(serverlessTemplate.Resources).forEach(resource => {
    if (resource.Type == resourceType_FunctionLayer) {
      const layer = resource.Properties.ContentUri?.[
        keywordFunctionLayer.keyword
      ] as FunctionLayerType;

      if (layer?.name) {
        libraries[layer.name] = layer.libraries || [];
      }
    }
  });
  return libraries;
};

export const overrideLayerContent = (
  rootDir: string,
  moduleName: string,
  layerName: string,
  content: Record<string, string>
) => {
  const functionLayerPath = join(
    rootDir,
    path_somodWorkingDir,
    path_serverless,
    path_functionLayers,
    moduleName,
    layerName
  );

  Object.keys(content).forEach(contentPath => {
    const contentFullPath = join(functionLayerPath, contentPath);

    mkdirSync(dirname(contentFullPath), { recursive: true });
    writeFileSync(contentFullPath, content[contentPath]);
  });
};
