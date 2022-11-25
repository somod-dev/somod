import { listFiles, unixStylePath } from "nodejs-file-utils";
import { JSONSchema7, validate } from "decorated-ajv";
import {
  IServerlessTemplateHandler,
  JSONObjectNode,
  JSONObjectType,
  JSONPrimitiveNode,
  KeywordDefinition
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
import { uniq, uniqBy } from "lodash";

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

export const keywordFunction: KeywordDefinition<FunctionType> = {
  keyword: "SOMOD::Function",

  getValidator: async (
    rootDir,
    moduleName,
    moduleHandler,
    serverlessTemplateHandler
  ) => {
    const definedFunctions = await getDefinedFunctions(rootDir);
    return async (keyword, node, value) => {
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
        const middlewareAllowedTypes: Record<string, string[]> = {};
        await Promise.all(
          (value.middlewares || []).map(async middleware => {
            const module = middleware["SOMOD::Ref"].module || moduleName;
            const resource = middleware["SOMOD::Ref"].resource;

            const mResource = await serverlessTemplateHandler.getResource(
              module,
              resource
            );
            middlewareAllowedTypes[JSON.stringify({ module, resource })] =
              mResource.Properties.AllowedTypes as string[];
          })
        );

        const unmatchedMiddlewares = (value.middlewares || []).filter(
          middleware => {
            const module = middleware["SOMOD::Ref"].module || moduleName;
            const resource = middleware["SOMOD::Ref"].resource;

            return !middlewareAllowedTypes[
              JSON.stringify({ module, resource })
            ].includes(value.type);
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
  serverlessTemplateHandler: IServerlessTemplateHandler,
  refNode: JSONObjectNode,
  currentModuleName: string
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
      Properties: {
        ServiceToken: { "SOMOD::Ref": { module?: string; resource: string } };
      } & Record<string, unknown>;
    };

    const _customResourceType = customResource.Type.substring(
      custom_resource_prefix.length
    );

    const functionResource = await serverlessTemplateHandler.getResource(
      customResource.Properties.ServiceToken["SOMOD::Ref"].module ||
        currentModuleName,
      customResource.Properties.ServiceToken["SOMOD::Ref"].resource
    );

    const codeUriOfTheTargetResource = functionResource?.Properties.CodeUri;

    const customResourceSchema = codeUriOfTheTargetResource
      ? (codeUriOfTheTargetResource[keywordFunction.keyword] as FunctionType)
          ?.customResources[_customResourceType]
      : undefined;

    if (customResourceSchema === undefined) {
      errors.push(
        new Error(
          `Unable to find the schema for the custom resource ${_customResourceType}. The custom resource function ${customResource.Properties.ServiceToken["SOMOD::Ref"].resource} must define the schema for the custom resource.`
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

const getLayerLibraries = async (
  layers: Partial<KeywordSomodRef>[],
  moduleName: string,
  serverlessTemplateHandler: IServerlessTemplateHandler
) => {
  const libraries = [];
  const layerRefs = layers.map(l => l["SOMOD::Ref"]).filter(l => !!l);
  layerRefs.forEach(l => {
    l.module = l.module || moduleName;
  });

  const uniqueLayerRefs = uniqBy(layerRefs, l => `${l.module}/${l.resource}`);

  await Promise.all(
    uniqueLayerRefs.map(async layerRef => {
      const resource = await serverlessTemplateHandler.getResource(
        layerRef.module,
        layerRef.resource
      );
      const layerLibraries = getLibrariesFromFunctionLayerResource(resource);
      libraries.push(...layerLibraries);
    })
  );
  return libraries;
};

const getMiddlewareLayers = async (
  middlewares: KeywordSomodRef[],
  moduleName: string,
  serverlessTemplateHandler: IServerlessTemplateHandler
) => {
  const layers: KeywordSomodRef[] = [];

  const middlewareRefs = middlewares.map(m => m["SOMOD::Ref"]);
  middlewareRefs.forEach(m => {
    m.module = m.module || moduleName;
  });

  const uniqueMiddlewareRefs = uniqBy(
    middlewareRefs,
    m => `${m.module}/${m.resource}`
  );

  await Promise.all(
    uniqueMiddlewareRefs.map(async middleWareRef => {
      const resource = await serverlessTemplateHandler.getResource(
        middleWareRef.module,
        middleWareRef.resource
      );
      layers.push(...(resource.Properties.Layers as KeywordSomodRef[]));
    })
  );
  return layers;
};

export const getDeclaredFunctionsWithExcludedLibraries = async (
  serverlessTemplateHandler: IServerlessTemplateHandler,
  moduleName: string
) => {
  const declaredFunctions: { name: string; exclude: string[] }[] = [];
  const currentServerlessTemplate = await serverlessTemplateHandler.getTemplate(
    moduleName
  );

  await Promise.all(
    Object.values(currentServerlessTemplate.template.Resources).map(
      async resource => {
        if (resource.Type == resourceType_Function) {
          const fun = resource.Properties.CodeUri?.[
            keywordFunction.keyword
          ] as FunctionType;
          const functionName = fun?.name;
          if (functionName) {
            const layers: KeywordSomodRef[] = [];
            layers.push(...(resource.Properties.Layers as KeywordSomodRef[]));
            layers.push(
              ...(await getMiddlewareLayers(
                fun.middlewares || [],
                moduleName,
                serverlessTemplateHandler
              ))
            );

            const exclude: string[] = ["aws-sdk"];
            exclude.push(
              ...(await getLayerLibraries(
                layers,
                moduleName,
                serverlessTemplateHandler
              ))
            );

            declaredFunctions.push({
              name: functionName,
              exclude: uniq(exclude)
            });
          }
        }
      }
    )
  );
  return declaredFunctions;
};
