import { JSONSchema7, validate } from "decorated-ajv";
import { existsSync } from "fs";
import { uniq, uniqBy } from "lodash";
import { listFiles, unixStylePath } from "nodejs-file-utils";
import { basename, extname, join } from "path";
import {
  IContext,
  IServerlessTemplateHandler,
  JSONObjectNode,
  JSONArrayType,
  JSONPrimitiveNode,
  KeywordDefinition,
  ServerlessResource
} from "somod-types";
import {
  custom_resource_prefix,
  path_functions,
  path_serverless,
  path_somodWorkingDir,
  resourceType_Function,
  resourceType_FunctionLayer,
  resourceType_FunctionMiddleware
} from "../../constants";
import {
  constructJson,
  getPath,
  parseJson,
  processKeywords
} from "../../jsonTemplate";
import { checkAccess } from "./access";
import { keywordExtend } from "./extend";
import {
  FunctionType,
  MergedFunctionResourceContainer
} from "./function-helper";
import {
  getLibrariesFromFunctionLayerResource,
  keywordFunctionLayer
} from "./functionLayer";
import { keywordFunctionMiddleware } from "./functionMiddleware";
import { keywordRef, KeywordSomodRef } from "./ref";

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
  if (functionName && !definedFunctions.includes(functionName)) {
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

const validateMiddlewares = (
  serverlessTemplateHandler: IServerlessTemplateHandler,
  moduleName: string,
  functionName: string,
  functionType: string,
  middlewares?: FunctionType["middlewares"]
) => {
  const middlewareResources = (middlewares || []).map(middlewareRef => {
    const module = middlewareRef.module || moduleName;
    const resource = middlewareRef.resource;
    const middlewareResource = serverlessTemplateHandler.getResource(
      module,
      resource
    );

    if (middlewareResource === null) {
      throw new Error(
        `Middleware {${module}, ${resource}} used in the function ${functionName} must exist`
      );
    }

    if (middlewareResource.resource.Type !== resourceType_FunctionMiddleware) {
      throw new Error(
        `Middleware {${module}, ${resource}} used in the function ${functionName} must be of type ${resourceType_FunctionMiddleware}`
      );
    }

    checkAccess(middlewareResource.resource, module, resource, moduleName);

    return { module, resource, resourceObj: middlewareResource.resource };
  });

  const unmatchedMiddlewares = middlewareResources.filter(middleware => {
    const allowedTypes = middleware.resourceObj.Properties.CodeUri?.[
      keywordFunctionMiddleware.keyword
    ]?.allowedTypes || [functionType];

    return !(allowedTypes.length == 0 || allowedTypes.includes(functionType));
  });

  if (unmatchedMiddlewares.length > 0) {
    throw new Error(
      `All middlewares in the function '${functionName}' must be allowed for type '${functionType}'. Unmatched middlewares are ${unmatchedMiddlewares
        .map(({ module, resource }) => module + "." + resource)
        .join(", ")}.`
    );
  }
};

const validateLayers = async (
  serverlessTemplateHandler: IServerlessTemplateHandler,
  moduleName: string,
  functionName: string,
  functionType: string,
  functionKeywordNode: JSONObjectNode
) => {
  const functionResourceProperties = constructJson(
    functionKeywordNode.parent.node
  ) as {
    Layers?: JSONArrayType;
  };

  if (
    !functionResourceProperties.Layers ||
    functionResourceProperties.Layers.length == 0
  ) {
    return;
  }

  const refKeywords: {
    path: string;
    ref: KeywordSomodRef["SOMOD::Ref"];
    referencedResource?: ServerlessResource;
  }[] = [];

  await processKeywords(parseJson(functionResourceProperties), {
    [keywordRef.keyword]: (
      keyword,
      node,
      value: KeywordSomodRef["SOMOD::Ref"]
    ) => {
      refKeywords.push({
        path: getPath(node).join("."),
        ref: { module: value.module || moduleName, resource: value.resource },
        referencedResource: serverlessTemplateHandler.getResource(
          value.module || moduleName,
          value.resource
        )?.resource
      });
      return { type: "keyword", value };
    }
  });

  const layerReferences = refKeywords.filter(
    ref => ref.referencedResource?.Type === resourceType_FunctionLayer
  );

  const unmatchedLayers = layerReferences.filter(layerRef => {
    const allowedTypes = layerRef.referencedResource.Properties.ContentUri?.[
      keywordFunctionLayer.keyword
    ]?.allowedTypes || [functionType];

    return !(allowedTypes.length == 0 || allowedTypes.includes(functionType));
  });

  if (unmatchedLayers.length > 0) {
    throw new Error(
      `All layers in the function '${functionName}' must be allowed for type '${functionType}'. Unmatched layers are ${unmatchedLayers
        .map(({ ref: { module, resource } }) => module + "." + resource)
        .join(", ")}.`
    );
  }
};

const isExtendedFunction = (node: JSONObjectNode) => {
  return (
    (node.parent.node.parent.node as JSONObjectNode).properties?.[
      keywordExtend.keyword
    ] !== undefined
  );
};

export const keywordFunction: KeywordDefinition<FunctionType> = {
  keyword: "SOMOD::Function",

  getValidator: async (moduleName, context) => {
    const definedFunctions = await getDefinedFunctions(context.dir);
    return async (keyword, node, value) => {
      const errors: Error[] = [];

      try {
        validateKeywordPosition(node);
        validateFunctionIsDefined(definedFunctions, value.name);
        validateAllEventsMatchTheFunctionType(node, value.name, value.type);
        validateMiddlewares(
          context.serverlessTemplateHandler,
          moduleName,
          value.name,
          value.type,
          value.middlewares
        );
        await validateLayers(
          context.serverlessTemplateHandler,
          moduleName,
          value.name,
          value.type,
          node
        );
      } catch (e) {
        errors.push(e);
      }

      return errors;
    };
  },

  getProcessor: async (moduleName, context) => async (keyword, node, value) => {
    if (isExtendedFunction(node)) {
      return { type: "keyword", value: { [keyword]: value } };
    }

    const resourceId = node.parent.node.parent.node.parent.key as string;
    const mergedFunctionResource =
      await MergedFunctionResourceContainer.getFinalFunctionResource(
        context,
        moduleName,
        resourceId
      );

    // NOTE: This path must match the bundled funtion location
    // refer code in ../bundleFunctions.ts
    const functionPath = unixStylePath(
      join(
        path_somodWorkingDir,
        path_serverless,
        path_functions,
        mergedFunctionResource.code.function.module,
        mergedFunctionResource.code.function.name
      )
    );

    if (context.isDebugMode) {
      // append the enable source-map during debug mode
      const properties = mergedFunctionResource.resource.Properties;
      if (properties.Environment === undefined) {
        properties.Environment = {};
      }
      if (properties.Environment["Variables"] === undefined) {
        properties.Environment["Variables"] = {};
      }
      // NODE_OPTIONS environment variable is always overrided in debug mode
      properties.Environment["Variables"].NODE_OPTIONS = "--enable-source-maps";
    }

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

const getLayerLibraries = (
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

  uniqueLayerRefs.forEach(layerRef => {
    const resource = serverlessTemplateHandler.getResource(
      layerRef.module,
      layerRef.resource
    );
    const layerLibraries = getLibrariesFromFunctionLayerResource(
      resource.resource
    );
    libraries.push(...layerLibraries);
  });
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
  context: IContext,
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
  const currentServerlessTemplate =
    context.serverlessTemplateHandler.getTemplate(moduleName);

  await Promise.all(
    Object.keys(currentServerlessTemplate.template.Resources).map(
      async resourceId => {
        const resource =
          currentServerlessTemplate.template.Resources[resourceId];
        if (
          resource[keywordExtend.keyword] === undefined &&
          resource.Type == resourceType_Function &&
          resource.Properties.CodeUri?.[keywordFunction.keyword] !== undefined
        ) {
          const finalFuncResource =
            await MergedFunctionResourceContainer.getFinalFunctionResource(
              context,
              moduleName,
              resourceId
            );
          const fun = finalFuncResource.resource.Properties.CodeUri?.[
            keywordFunction.keyword
          ] as FunctionType;
          const functionName = fun?.name;
          if (functionName) {
            const layers = (finalFuncResource.resource.Properties.Layers ||
              []) as KeywordSomodRef[];

            const exclude: string[] = ["@aws-sdk/*"];
            exclude.push(
              ...getLayerLibraries(
                layers,
                moduleName,
                context.serverlessTemplateHandler
              )
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
