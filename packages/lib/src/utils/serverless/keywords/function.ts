import { listFiles, unixStylePath } from "nodejs-file-utils";
import { JSONSchema7, validate } from "decorated-ajv";
import {
  JSONObjectNode,
  JSONObjectType,
  JSONPrimitiveNode,
  KeywordDefinition,
  ModuleTemplate,
  ServerlessTemplate
} from "somod-types";
import { existsSync } from "fs";
import { basename, extname, join } from "path";
import {
  custom_resource_prefix,
  path_functions,
  path_serverless,
  path_somodWorkingDir,
  resourceType_Function
} from "../../constants";
import { constructJson, getPath } from "../../jsonTemplate";
import { KeywordSomodRef } from "./ref";
import { getLibrariesFromFunctionLayerResource } from "./functionLayer";
import { uniq } from "lodash";

type FunctionType = {
  type: string;
  name: string;
  customResources?: JSONObjectType;
  middlewares?: KeywordSomodRef[];
};

export type KeywordSomodFunction = {
  "SOMOD::Function": FunctionType;
};

const getDefinedFunctions = async (dir: string) => {
  const functionsDir = join(dir, path_serverless, path_functions);
  if (!existsSync(functionsDir)) {
    return [];
  }
  const files = await listFiles(functionsDir);
  const functions = files
    .filter(file => file.indexOf("/") == -1)
    .map(file => basename(file, extname(file)));
  return functions;
};

export const keywordFunction: KeywordDefinition<
  FunctionType,
  ServerlessTemplate
> = {
  keyword: "SOMOD::Function",

  getValidator: async (rootDir, moduleName, moduleContentMap) => {
    const definedFunctions = await getDefinedFunctions(rootDir);
    return (keyword, node, value) => {
      const errors: Error[] = [];

      const path = getPath(node);
      if (
        !(
          path.length == 4 &&
          path[0] == "Resources" &&
          path[2] == "Properties" &&
          path[3] == "CodeUri" &&
          (
            (node.parent.node.parent.node as JSONObjectNode).properties
              ?.Type as JSONPrimitiveNode
          ).value == resourceType_Function
        )
      ) {
        errors.push(
          new Error(
            `${keyword} is allowed only as value of CodeUri property of ${resourceType_Function} resource`
          )
        );
      } else {
        //NOTE: structure of the value is validated by serverless-schema

        if (!definedFunctions.includes(value.name)) {
          errors.push(
            new Error(
              `Function ${value.name} not found. Create the function under ${path_serverless}/${path_functions} directory`
            )
          );
        }

        // events
        const functionResourceProperties = constructJson(node.parent.node) as {
          Events?: Record<string, { Type: string }>;
        };
        const events = functionResourceProperties.Events || {};
        const unmatchedEvents = Object.keys(events).filter(
          eventName => events[eventName].Type != value.type
        );
        if (unmatchedEvents.length > 0) {
          errors.push(
            new Error(
              `All Events in the function '${
                value.name
              }' must match its type '${
                value.type
              }'. Unmatched events are ${unmatchedEvents.join(", ")}.`
            )
          );
        }

        // middlewares
        const unmatchedMiddlewares = (value.middlewares || []).filter(
          middleware => {
            const targetModule = middleware["SOMOD::Ref"].module || moduleName;
            const allowedTypes = moduleContentMap[targetModule].json.Resources[
              middleware["SOMOD::Ref"].resource
            ].Properties["AllowedTypes"] as string[];
            return !allowedTypes.includes(value.type);
          }
        );
        if (unmatchedMiddlewares.length > 0) {
          errors.push(
            new Error(
              `All middlewares in the function '${
                value.name
              }' must be allowed for type '${
                value.type
              }'. Unmatched middlewares are ${unmatchedMiddlewares
                .map(
                  m =>
                    (m["SOMOD::Ref"].module || moduleName) +
                    "." +
                    m["SOMOD::Ref"].resource
                )
                .join(", ")}.`
            )
          );
        }
      }

      return errors;
    };
  },

  getProcessor: async (rootDir, moduleName) => (keyword, node, value) => {
    return {
      type: "object",
      value: unixStylePath(
        join(
          rootDir,
          path_somodWorkingDir,
          path_serverless,
          path_functions,
          moduleName,
          value.name
        )
      )
    };
  }
};

export const checkCustomResourceSchema = async (
  refNode: JSONObjectNode,
  targetTemplate: ModuleTemplate<ServerlessTemplate>,
  targetResource: string
): Promise<Error[]> => {
  const errors: Error[] = [];

  // assumption is that the existance of target resource is already verified

  const path = getPath(refNode);
  if (
    path.length == 4 &&
    path[0] == "Resources" &&
    path[2] == "Properties" &&
    path[3] == "ServiceToken" &&
    (
      (
        (refNode.parent.node.parent.node as JSONObjectNode).properties
          ?.Type as JSONPrimitiveNode
      ).value as string
    )?.startsWith(custom_resource_prefix)
  ) {
    // the ref node is referring a function which implements custom resource

    const customResourceNode = refNode.parent.node.parent.node;
    const customResource = constructJson(customResourceNode) as {
      Type: string;
      Properties: { ServiceToken?: unknown } & Record<string, unknown>;
    };

    const _customResourceType = customResource.Type.substring(
      custom_resource_prefix.length
    );

    const codeUriOfTheTargetResource =
      targetTemplate.json.Resources[targetResource]?.Properties.CodeUri;

    const customResourceSchema = codeUriOfTheTargetResource
      ? (codeUriOfTheTargetResource[keywordFunction.keyword] as FunctionType)
          ?.customResources[_customResourceType]
      : undefined;

    if (customResourceSchema === undefined) {
      errors.push(
        new Error(
          `Unable to find the schema for the custom resource ${_customResourceType}. The custom resource function ${targetResource} must define the schema for the custom resource.`
        )
      );
    } else {
      delete customResource.Properties.ServiceToken;
      try {
        const violations = await validate(
          customResourceSchema as JSONSchema7,
          customResource.Properties
        );
        if (violations.length > 0) {
          errors.push(
            new Error(
              `Custom Resource ${
                path[1]
              } has following validation errors\n${violations
                .map(v => `${v.path} ${v.message}`.trim())
                .join("\n")}`
            )
          );
        }
      } catch (e) {
        errors.push(e);
      }
    }
  }

  return errors;
};

const getLayerLibraries = (
  layers: KeywordSomodRef[],
  moduleName: string,
  serverlessTemplateMap: Record<string, ServerlessTemplate>
) => {
  const libraries = [];
  layers.forEach(layer => {
    if (layer["SOMOD::Ref"]) {
      const layerModule = layer["SOMOD::Ref"].module || moduleName;
      const layerResourceId = layer["SOMOD::Ref"].resource;
      const layerLibraries = getLibrariesFromFunctionLayerResource(
        serverlessTemplateMap[layerModule].Resources[layerResourceId]
      );
      libraries.push(...layerLibraries);
    }
  });
  return libraries;
};

const getMiddlewareLayers = (
  middlewares: KeywordSomodRef[],
  moduleName: string,
  serverlessTemplateMap: Record<string, ServerlessTemplate>
) => {
  const layers: KeywordSomodRef[] = [];
  middlewares.forEach(middleWare => {
    const middlewareModule = middleWare["SOMOD::Ref"].module || moduleName;
    const middlewareResource =
      serverlessTemplateMap[middlewareModule].Resources[
        middleWare["SOMOD::Ref"].resource
      ];
    layers.push(...(middlewareResource.Properties.Layers as KeywordSomodRef[]));
  });
  return layers;
};

export const getDeclaredFunctionsWithExcludedLibraries = (
  moduleName: string,
  serverlessTemplateMap: Record<string, ServerlessTemplate>
) => {
  const declaredFunctions: { name: string; exclude: string[] }[] = [];
  const serverlessTemplate = serverlessTemplateMap[moduleName];
  Object.values(serverlessTemplate.Resources).forEach(resource => {
    if (resource.Type == resourceType_Function) {
      const fun = resource.Properties.CodeUri?.[
        keywordFunction.keyword
      ] as FunctionType;
      const functionName = fun?.name;
      if (functionName) {
        const layers: KeywordSomodRef[] = [];
        layers.push(...(resource.Properties.Layers as KeywordSomodRef[]));
        layers.push(
          ...getMiddlewareLayers(
            fun.middlewares || [],
            moduleName,
            serverlessTemplateMap
          )
        );

        const exclude: string[] = ["aws-sdk"];
        exclude.push(
          ...getLayerLibraries(layers, moduleName, serverlessTemplateMap)
        );

        declaredFunctions.push({ name: functionName, exclude: uniq(exclude) });
      }
    }
  });
  return declaredFunctions;
};
