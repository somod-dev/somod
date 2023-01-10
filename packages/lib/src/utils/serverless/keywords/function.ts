import { listFiles, unixStylePath } from "nodejs-file-utils";
import { JSONSchema7, validate } from "decorated-ajv";
import {
  IServerlessTemplateHandler,
  JSONObjectNode,
  JSONObjectType,
  JSONPrimitiveNode,
  KeywordDefinition,
  ServerlessResource,
  ResourcePropertyModuleMapNode,
  JSONArrayType
} from "somod-types";
import { existsSync } from "fs";
import { basename, extname, join } from "path";
import {
  custom_resource_prefix,
  path_functions,
  path_serverless,
  path_somodWorkingDir,
  resourceType_Function,
  resourceType_FunctionMiddleware
} from "../../constants";
import {
  constructJson,
  getPath,
  parseJson,
  processKeywords
} from "../../jsonTemplate";
import { keywordRef, KeywordSomodRef } from "./ref";
import { getLibrariesFromFunctionLayerResource } from "./functionLayer";
import { isEqual, uniq, uniqBy } from "lodash";
import { checkAccess } from "./access";
import { keywordExtend } from "./extend";
import JSONObjectMerge from "json-object-merge";
import { keywordFunctionMiddleware } from "./functionMiddleware";

type FunctionType = {
  type: string;
  name: string;
  customResources?: JSONObjectType;
  middlewares?: { module?: string; resource: string }[];
};

export type FinalFunctionResource = {
  resource: ServerlessResource;
  code: {
    function: { module: string; name?: string };
    middlewares: { module: string; name: string }[];
  };
};

/**
 * A Container class to create and store the Function Resource Properties (merged from different sources).
 *
 * The store is in memory store
 *
 * The Final Properties of a Function Resource comes from different modules and resource.
 * The order of merging is
 *   - Original Function
 *   - From Extended Function Resources (In the order of module dependency)
 *   - Middlewares from the lifecycle (In the order of module dependency)
 *   - Layers from from the lifecycle (In the order of module dependency)
 *   - All middleware Properties (The middlewares are choosen from the result of previous step)
 *       - Each Middleware is merged with Extended Middleware resources
 *
 * Stores Final function resource
 *
 */
export class MergedFunctionResourceContainer {
  static store: Record<string, Record<string, FinalFunctionResource>> = {};

  /**
   *
   * @param module module name
   * @param resource resource id
   * @returns Final function resource (the optional `module` property inside `SOMOD::Function.middlewares` and `SOMOD::Ref` keyword will be added with the right module)
   * @throws Error if the Resource specified with `module` and `resource` is not a valid function resource which does not have `SOMOD::Extend` keyword
   */
  static async getFinalFunctionResource(
    serverlessTemplateHandler: IServerlessTemplateHandler,
    module: string,
    resource: string
  ) {
    if (this.store[module]?.[resource] === undefined) {
      const originalFunctionResource = (
        await serverlessTemplateHandler.getTemplate(module)
      )?.template.Resources[resource];

      if (originalFunctionResource === undefined) {
        throw new Error(
          `Function Resource {${module}, ${resource}} does not exist.`
        );
      }

      if (originalFunctionResource[keywordExtend.keyword] !== undefined) {
        throw new Error(
          `Function Resource {${module}, ${resource}} must not contain ${keywordExtend.keyword} keyword`
        );
      }

      if (!this.store[module]) {
        this.store[module] = {};
      }
      this.store[module][resource] = await this._getFinalFunctionResource(
        serverlessTemplateHandler,
        module,
        resource
      );
    }
    return this.store[module][resource];
  }

  private static async _getFinalFunctionResource(
    serverlessTemplateHandler: IServerlessTemplateHandler,
    module: string,
    resource: string
  ): Promise<FinalFunctionResource> {
    const extendedFuncResource = await serverlessTemplateHandler.getResource(
      module,
      resource
    );
    const code: FinalFunctionResource["code"] = {
      function: {
        module: serverlessTemplateHandler.getNearestModuleForResourceProperty(
          ["CodeUri", keywordFunction.keyword, "name"],
          extendedFuncResource.propertyModuleMap
        ).module,
        name: extendedFuncResource.resource.Properties.CodeUri?.[
          keywordFunction.keyword
        ]?.name
      },
      middlewares: []
    };

    // TODO: Add lifecycle middlewares
    // TODO: Add lifecycle layers

    const extendedFuncResourcePropertiesWithModuleRefCorrected =
      await this._correctModuleReference(
        serverlessTemplateHandler,
        extendedFuncResource.resource.Properties,
        extendedFuncResource.propertyModuleMap
      );

    const middlewares = ((
      extendedFuncResourcePropertiesWithModuleRefCorrected as JSONObjectType & {
        CodeUri?: KeywordSomodFunction;
      }
    ).CodeUri?.["SOMOD::Function"]?.middlewares || []) as {
      module: string;
      resource: string;
    }[];

    let propertiesMergedWithMiddlewares =
      extendedFuncResourcePropertiesWithModuleRefCorrected as ServerlessResource["Properties"];

    for (const middleware of middlewares) {
      const extendedMiddlewareResource =
        await serverlessTemplateHandler.getResource(
          middleware.module,
          middleware.resource
        );

      code.middlewares.push({
        module: serverlessTemplateHandler.getNearestModuleForResourceProperty(
          ["CodeUri", keywordFunctionMiddleware.keyword, "name"],
          extendedMiddlewareResource.propertyModuleMap
        ).module,
        name: extendedMiddlewareResource.resource.Properties.CodeUri?.[
          keywordFunctionMiddleware.keyword
        ]?.name
      });

      const extendedMiddlewareResourceProperties = {
        ...extendedMiddlewareResource.resource.Properties
      };
      delete extendedMiddlewareResourceProperties.CodeUri; // don't merge the CodeUri property

      const extendedMiddlewareResourcePropertiesWithModuleRefCorrected =
        await this._correctModuleReference(
          serverlessTemplateHandler,
          extendedMiddlewareResourceProperties,
          extendedMiddlewareResource.propertyModuleMap
        );

      propertiesMergedWithMiddlewares = JSONObjectMerge(
        propertiesMergedWithMiddlewares,
        extendedMiddlewareResourcePropertiesWithModuleRefCorrected,
        { "$.Layers": "APPEND" }
      ) as JSONObjectType;
    }

    const mergedProperties =
      propertiesMergedWithMiddlewares as ServerlessResource["Properties"] & {
        Layers?: JSONArrayType;
      };
    if (mergedProperties.Layers) {
      mergedProperties.Layers = uniqBy(mergedProperties.Layers, isEqual);
    }

    return {
      code,
      resource: {
        ...extendedFuncResource.resource,
        Properties: propertiesMergedWithMiddlewares
      }
    };
  }

  private static async _correctModuleReference(
    serverlessTemplateHandler: IServerlessTemplateHandler,
    properties: JSONObjectType,
    propertyModuleMap: ResourcePropertyModuleMapNode
  ) {
    // assumption is that the placement of keywords is correct and validated before code execution is reached here

    const updatedProperties = await processKeywords(parseJson(properties), {
      [keywordFunction.keyword]: (keyword, node, value: FunctionType) => {
        const keywordPath = getPath(node);
        keywordPath.push("middlewares");
        const moduleForMiddlewaresProperty =
          serverlessTemplateHandler.getNearestModuleForResourceProperty(
            keywordPath,
            propertyModuleMap
          );

        const updatedValue = {
          ...value,
          middlewares: value.middlewares?.map((middleware, i) => {
            let module = middleware.module;
            if (module == undefined) {
              if (moduleForMiddlewaresProperty.depth < keywordPath.length - 1) {
                module = moduleForMiddlewaresProperty.module;
              } else {
                const moduleForThisMiddleware =
                  serverlessTemplateHandler.getNearestModuleForResourceProperty(
                    [...keywordPath, i],
                    propertyModuleMap
                  );
                module = moduleForThisMiddleware.module;
              }
            }
            return { module, resource: middleware.resource };
          })
        };

        return { type: "keyword", value: { [keyword]: updatedValue } };
      },
      [keywordExtend.keyword]: (
        keyword,
        node,
        value: KeywordSomodRef["SOMOD::Ref"]
      ) => {
        const updatedValue = { ...value };
        if (updatedValue.module === undefined) {
          const keywordPath = getPath(node);
          const moduleForThisRef =
            serverlessTemplateHandler.getNearestModuleForResourceProperty(
              keywordPath,
              propertyModuleMap
            );
          updatedValue.module = moduleForThisRef.module;
        }
        return {
          type: "keyword",
          value: { [keyword]: updatedValue }
        };
      }
    });

    return updatedProperties;
  }
}

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

const validateKeywordPosition = (node: JSONObjectNode) => {
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
    throw new Error(
      `${keywordFunction.keyword} is allowed only as value of CodeUri property of ${resourceType_Function} resource`
    );
  }
};

const validateFunctionIsDefined = (
  definedFunctions: string[],
  functionName: string
) => {
  if (!definedFunctions.includes(functionName)) {
    throw new Error(
      `Function ${functionName} not found. Create the function under ${path_serverless}/${path_functions} directory`
    );
  }
};

const validateAllEventsMatchTheFunctionType = (
  node: JSONObjectNode,
  functionName: string,
  functionType: string
) => {
  const functionResourceProperties = constructJson(node.parent.node) as {
    Events?: Record<string, { Type: string }>;
  };
  const events = functionResourceProperties.Events || {};
  const unmatchedEvents = Object.keys(events).filter(
    eventName => events[eventName].Type != functionType
  );
  if (unmatchedEvents.length > 0) {
    throw new Error(
      `All Events in the function '${functionName}' must match its type '${functionType}'. Unmatched events are ${unmatchedEvents.join(
        ", "
      )}.`
    );
  }
};

const validateMiddlewares = async (
  serverlessTemplateHandler: IServerlessTemplateHandler,
  moduleName: string,
  node: JSONObjectNode,
  functionName: string,
  functionType: string,
  middlewares?: FunctionType["middlewares"]
) => {
  const middlewareResources = await Promise.all(
    (middlewares || []).map(async middlewareRef => {
      const module = middlewareRef.module || moduleName;
      const resource = middlewareRef.resource;
      const middlewareResource = await serverlessTemplateHandler.getResource(
        module,
        resource
      );

      if (middlewareResource === null) {
        throw new Error(
          `Middleware {${module}, ${resource}} used in the function ${functionName} must exist`
        );
      }

      if (
        middlewareResource.resource.Type !== resourceType_FunctionMiddleware
      ) {
        throw new Error(
          `Middleware {${module}, ${resource}} used in the function ${functionName} must be of type ${resourceType_FunctionMiddleware}`
        );
      }

      checkAccess(middlewareResource.resource, module, resource, moduleName);

      return { module, resource, resourceObj: middlewareResource.resource };
    })
  );

  const unmatchedMiddlewares = middlewareResources.filter(
    middleware =>
      !(middleware.resourceObj.Properties.AllowedTypes as string[]).includes(
        functionType
      )
  );

  if (unmatchedMiddlewares.length > 0) {
    throw new Error(
      `All middlewares in the function '${functionName}' must be allowed for type '${functionType}'. Unmatched middlewares are ${unmatchedMiddlewares
        .map(({ module, resource }) => module + "." + resource)
        .join(", ")}.`
    );
  }
};

const isExtendedFunction = (node: JSONObjectNode) => {
  return (
    (node.parent.node.parent.node as JSONObjectNode).properties?.[
      keywordExtend.keyword
    ] === undefined
  );
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

      try {
        validateKeywordPosition(node);
        validateFunctionIsDefined(definedFunctions, value.name);
        validateAllEventsMatchTheFunctionType(node, value.name, value.type);
        validateMiddlewares(
          serverlessTemplateHandler,
          moduleName,
          node,
          value.name,
          value.type,
          value.middlewares
        );
      } catch (e) {
        errors.push(e);
      }

      return errors;
    };
  },

  getProcessor:
    async (rootDir, moduleName, moduleHandler, serverlessTemplateHandler) =>
    async (keyword, node, value) => {
      if (isExtendedFunction(node)) {
        return { type: "keyword", value: { [keyword]: value } };
      }

      const functionPath = unixStylePath(
        join(
          rootDir,
          path_somodWorkingDir,
          path_serverless,
          path_functions,
          moduleName,
          value.name
        )
      );

      if (!value.middlewares || value.middlewares.length == 0) {
        return {
          type: "object",
          value: functionPath
        };
      }

      const resourceId = node.parent.node.parent.node.parent.node.parent
        .key as string;
      const mergedFunctionResource =
        await MergedFunctionResourceContainer.getFinalFunctionResource(
          serverlessTemplateHandler,
          moduleName,
          resourceId
        );

      return {
        type: "object",
        value: {
          ...mergedFunctionResource.resource.Properties,
          CodeUri: functionPath
        },
        level: 1
      };
    }
};

export const checkCustomResourceSchema = async (
  resource: ServerlessResource,
  refNode: JSONObjectNode
) => {
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

    const codeUriOfTheTargetResource = resource.Properties.CodeUri;

    const customResourceSchema = codeUriOfTheTargetResource
      ? (codeUriOfTheTargetResource[keywordFunction.keyword] as FunctionType)
          ?.customResources[_customResourceType]
      : undefined;

    if (customResourceSchema === undefined) {
      throw new Error(
        `Unable to find the schema for the custom resource ${_customResourceType}. The custom resource function ${customResource.Properties.ServiceToken["SOMOD::Ref"].resource} must define the schema for the custom resource.`
      );
    } else {
      delete customResource.Properties.ServiceToken;
      const violations = await validate(
        customResourceSchema as JSONSchema7,
        customResource.Properties
      );
      if (violations.length > 0) {
        throw new Error(
          `Custom Resource ${
            path[1]
          } has following validation errors\n${violations
            .map(v => `${v.path} ${v.message}`.trim())
            .join("\n")}`
        );
      }
    }
  }
};

const getLayerLibraries = async (
  layers: Partial<KeywordSomodRef>[],
  moduleName: string,
  serverlessTemplateHandler: IServerlessTemplateHandler
) => {
  const libraries = [];
  const layerRefs = layers.map(l => l[keywordRef.keyword]).filter(l => !!l);
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
      const layerLibraries = getLibrariesFromFunctionLayerResource(
        resource.resource
      );
      libraries.push(...layerLibraries);
    })
  );
  return libraries;
};

/**
 * Returns the list functions from the module
 *
 * Skips the functions with SOMOD::Extend keyword
 *
 * @param serverlessTemplateHandler
 * @param moduleName
 * @returns
 * ```
 *   {
 *      module: string, // module name where the function code is located
 *      name: string, // name of the function
 *      exclude: string[], // list of libraries to exclude
 *      middlewares: {
 *         module: string, // module name where the middleware code is located
 *         name: string // module name
 *      }
 *   }
 * ```
 */
export const getDeclaredFunctions = async (
  serverlessTemplateHandler: IServerlessTemplateHandler,
  moduleName: string
) => {
  type DeclaredFunction = {
    module: string; // module name where the function code is located
    name: string; // name of the function
    exclude: string[]; // list of libraries to exclude
    middlewares: {
      module: string; // module name where the middleware code is located
      name: string; // module name
    }[];
  };

  const declaredFunctions: DeclaredFunction[] = [];
  const currentServerlessTemplate = await serverlessTemplateHandler.getTemplate(
    moduleName
  );

  await Promise.all(
    Object.keys(currentServerlessTemplate.template.Resources).map(
      async resourceId => {
        const resource =
          currentServerlessTemplate.template.Resources[resourceId];
        if (
          resource.Type == resourceType_Function &&
          resource[keywordExtend.keyword] === undefined
        ) {
          const finalFuncResource =
            await MergedFunctionResourceContainer.getFinalFunctionResource(
              serverlessTemplateHandler,
              moduleName,
              resourceId
            );
          const fun = finalFuncResource.resource.Properties.CodeUri?.[
            keywordFunction.keyword
          ] as FunctionType;
          const functionName = fun?.name;
          if (functionName) {
            const layers = finalFuncResource.resource.Properties
              .Layers as KeywordSomodRef[];

            const exclude: string[] = ["aws-sdk"];
            exclude.push(
              ...(await getLayerLibraries(
                layers,
                moduleName,
                serverlessTemplateHandler
              ))
            );

            declaredFunctions.push({
              module: finalFuncResource.code.function.module,
              name: finalFuncResource.code.function.name,
              exclude: uniq(exclude),
              middlewares: finalFuncResource.code.middlewares
            });
          }
        }
      }
    )
  );
  return declaredFunctions;
};
