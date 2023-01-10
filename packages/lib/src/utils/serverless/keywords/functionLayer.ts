import { readJsonFileStore, unixStylePath } from "nodejs-file-utils";
import {
  IServerlessTemplateHandler,
  JSONObjectNode,
  JSONPrimitiveNode,
  KeywordDefinition,
  ServerlessTemplate
} from "somod-types";
import { join } from "path";
import {
  file_packageJson,
  path_functionLayers,
  path_serverless,
  path_somodWorkingDir,
  resourceType_FunctionLayer
} from "../../constants";
import { getPath } from "../../jsonTemplate";
import { keywordExtend } from "./extend";

type FunctionLayerType = {
  name: string;
  libraries?: string[];
  content?: Record<string, string>;
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
    ] === undefined
  );
};

export const keywordFunctionLayer: KeywordDefinition<FunctionLayerType> = {
  keyword: "SOMOD::FunctionLayer",

  getValidator: async rootDir => {
    const modulePackageJsonPath = join(rootDir, file_packageJson);
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

  getProcessor:
    async (rootDir, moduleName, moduleHandler, serverlessTemplateHandler) =>
    async (keyword, node, value) => {
      if (isExtendedFunctionLayer(node)) {
        return { type: "keyword", value: { [keyword]: value } };
      }

      const resourceId = node.parent.node.parent.node.parent.node.parent
        .key as string;

      const functionLayerWithExtendedProperties =
        await serverlessTemplateHandler.getResource(moduleName, resourceId);

      const valueExtended = functionLayerWithExtendedProperties.resource
        .Properties.ContentUri?.[
        keywordFunctionLayer.keyword
      ] as FunctionLayerType;

      const functionLayerPath = join(
        rootDir,
        path_somodWorkingDir,
        path_serverless,
        path_functionLayers,
        moduleName,
        valueExtended.name
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

export const getDeclaredFunctionLayers = async (
  serverlessTemplateHandler: IServerlessTemplateHandler,
  moduleName: string
) => {
  type DeclaredLayer = {
    module: string;
    name: string;
    libraries: { name: string; module: string }[];
    content: Record<string, string>;
  };

  const serverlessTemplate = (
    await serverlessTemplateHandler.getTemplate(moduleName)
  ).template;

  const declaredLayers: DeclaredLayer[] = [];

  await Promise.all(
    Object.keys(serverlessTemplate.Resources).map(async resourceId => {
      const resource = serverlessTemplate.Resources[resourceId];
      if (
        resource.Type == resourceType_FunctionLayer &&
        resource[keywordExtend.keyword] === undefined
      ) {
        const extendedLayerResource =
          await serverlessTemplateHandler.getResource(moduleName, resourceId);

        const layer = extendedLayerResource.resource.Properties.ContentUri?.[
          keywordFunctionLayer.keyword
        ] as FunctionLayerType;

        const layerName = layer?.name;

        if (layerName) {
          declaredLayers.push({
            module:
              serverlessTemplateHandler.getNearestModuleForResourceProperty(
                ["ContentUri", keywordFunctionLayer.keyword, "name"],
                extendedLayerResource.propertyModuleMap
              ).module,
            name: layerName,
            libraries: await Promise.all(
              (layer.libraries || []).map(async library => {
                const libraryModule =
                  serverlessTemplateHandler.getNearestModuleForResourceProperty(
                    ["ContentUri", keywordFunctionLayer.keyword, "name"],
                    extendedLayerResource.propertyModuleMap
                  ).module;
                return { name: library, module: libraryModule };
              })
            ),
            content: layer.content || {}
          });
        }
      }
    })
  );
  return declaredLayers;
};
