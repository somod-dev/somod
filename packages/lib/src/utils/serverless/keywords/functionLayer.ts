import { readJsonFileStore, unixStylePath } from "nodejs-file-utils";
import {
  IServerlessTemplateHandler,
  JSONObjectNode,
  JSONPrimitiveNode,
  KeywordDefinition,
  ServerlessTemplate
} from "somod-types";
import { dirname, join } from "path";
import {
  file_packageJson,
  path_functionLayers,
  path_serverless,
  path_somodWorkingDir,
  resourceType_FunctionLayer
} from "../../constants";
import { getPath } from "../../jsonTemplate";
import { keywordExtend } from "./extend";
import { mkdir, writeFile } from "fs/promises";

type FunctionLayerType = {
  name: string;
  libraries?: string[];
  content?: Record<string, string>;
  allowedTypes?: string[];
};

const validateKeywordPosition = (node: JSONObjectNode) => {
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
    throw new Error(
      `${keywordFunctionLayer.keyword} is allowed only as value of ContentUri property of ${resourceType_FunctionLayer} resource`
    );
  }
};

const isExtendedFunctionLayer = (node: JSONObjectNode) => {
  return (
    (node.parent.node.parent.node as JSONObjectNode).properties?.[
      keywordExtend.keyword
    ] !== undefined
  );
};

export const keywordFunctionLayer: KeywordDefinition<FunctionLayerType> = {
  keyword: "SOMOD::FunctionLayer",

  getValidator: async (moduleName, context) => {
    const modulePackageJsonPath = join(context.dir, file_packageJson);
    const modulePackageJson = await readJsonFileStore(modulePackageJsonPath);
    const moduleDevDependencies = modulePackageJson.devDependencies || {};

    return (keyword, node, value) => {
      const errors: Error[] = [];

      try {
        validateKeywordPosition(node);
      } catch (e) {
        errors.push(e);
      }

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

  getProcessor: async (moduleName, context) => async (keyword, node, value) => {
    const resourceId = node.parent.node.parent.node.parent.key as string;

    // save the layer content in working directory
    await Promise.all(
      Object.keys(value.content || {}).map(async contentPath => {
        const fullContentPath = join(
          context.dir,
          path_somodWorkingDir,
          path_serverless,
          "." + path_functionLayers,
          moduleName,
          resourceId,
          contentPath
        );
        await mkdir(dirname(fullContentPath), { recursive: true });
        await writeFile(fullContentPath, value.content[contentPath]);
      })
    );

    if (isExtendedFunctionLayer(node)) {
      return { type: "keyword", value: { [keyword]: value } };
    }

    const functionLayerWithExtendedProperties =
      context.serverlessTemplateHandler.getResource(moduleName, resourceId);

    const functionLayerPath = join(
      path_somodWorkingDir,
      path_serverless,
      path_functionLayers,
      context.serverlessTemplateHandler.getResourcePropertySource(
        ["ContentUri", keywordFunctionLayer.keyword, "name"],
        functionLayerWithExtendedProperties.propertySourceMap
      ).module,
      functionLayerWithExtendedProperties.resource.Properties.ContentUri?.[
        keywordFunctionLayer.keyword
      ].name
    );

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

export const getDeclaredFunctionLayers = (
  serverlessTemplateHandler: IServerlessTemplateHandler,
  moduleName: string
) => {
  type DeclaredLayer = {
    module: string;
    name: string;
    libraries: { name: string; module: string }[];
    content: { path: string; module: string; resource: string }[];
  };

  const serverlessTemplate =
    serverlessTemplateHandler.getTemplate(moduleName).template;

  const declaredLayers: DeclaredLayer[] = [];

  Object.keys(serverlessTemplate.Resources).forEach(resourceId => {
    const resource = serverlessTemplate.Resources[resourceId];
    if (
      resource.Type == resourceType_FunctionLayer &&
      resource[keywordExtend.keyword] === undefined
    ) {
      const extendedLayerResource = serverlessTemplateHandler.getResource(
        moduleName,
        resourceId
      );

      const layer = extendedLayerResource.resource.Properties.ContentUri?.[
        keywordFunctionLayer.keyword
      ] as FunctionLayerType;

      const layerName = layer?.name;

      if (layerName) {
        declaredLayers.push({
          module: serverlessTemplateHandler.getResourcePropertySource(
            ["ContentUri", keywordFunctionLayer.keyword, "name"],
            extendedLayerResource.propertySourceMap
          ).module,
          name: layerName,
          libraries: (layer.libraries || []).map((library, i) => {
            const libraryModule =
              serverlessTemplateHandler.getResourcePropertySource(
                ["ContentUri", keywordFunctionLayer.keyword, "libraries", i],
                extendedLayerResource.propertySourceMap
              ).module;
            return { name: library, module: libraryModule };
          }),
          content: Object.keys(layer.content || {}).map(contentPath => {
            const contentSource =
              serverlessTemplateHandler.getResourcePropertySource(
                [
                  "ContentUri",
                  keywordFunctionLayer.keyword,
                  "content",
                  contentPath
                ],
                extendedLayerResource.propertySourceMap
              );
            return {
              path: contentPath,
              module: contentSource.module,
              resource: contentSource.resource
            };
          })
        });
      }
    }
  });
  return declaredLayers;
};
