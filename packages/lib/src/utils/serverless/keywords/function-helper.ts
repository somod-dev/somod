import JSONObjectMerge from "json-object-merge";
import { isEqual, uniqWith } from "lodash";
import {
  IContext,
  IServerlessTemplateHandler,
  JSONArrayType,
  JSONObjectType,
  ResourcePropertySourceNode,
  ServerlessResource
} from "somod-types";
import { resourceType_Function } from "../../constants";
import { freeze } from "../../freeze";
import { getPath, parseJson, processKeywords } from "../../jsonTemplate";
import { keywordExtend } from "./extend";
import { keywordFunctionLayer } from "./functionLayer";
import { keywordFunctionMiddleware } from "./functionMiddleware";
import { keywordRef, KeywordSomodRef } from "./ref";

export const functionKeyword = "SOMOD::Function";

export type KeywordSomodFunction = {
  [functionKeyword]: FunctionType;
};

export type FunctionType = {
  type: string;
  name: string;
  customResources?: JSONObjectType;
  middlewares?: { module?: string; resource: string }[];
};

export type FinalFunctionResource = {
  resource: ServerlessResource;
  code: {
    function: { module: string; name: string };
    middlewares: { module: string; name: string }[];
  };
};

/**
 * A Container class to create and store the Function Resource Properties (merged from different sources).
 *
 * The store is in-memory store
 *
 * The Final Properties of a Function Resource comes from different modules and resource.
 * The order of merging is
 *   - Original Function
 *   - From Extended Function Resources (In the order of module dependency)
 *   - Middlewares from the extensions (In the order of module dependency)
 *   - Layers from from the extensions (In the order of module dependency)
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
   * @throws Error when the Resource specified with `module` and `resource`
   *    - does not exists OR
   *    - not of type `AWS::Serverless::Function` OR
   *    - has `SOMOD::Extend` keyword OR
   *    - not have `SOMOD::Function` keyword in its `CodeUri` property
   */
  static async getFinalFunctionResource(
    context: IContext,
    module: string,
    resource: string
  ) {
    if (this.store[module]?.[resource] === undefined) {
      const originalFunctionResource =
        context.serverlessTemplateHandler.getTemplate(module)?.template
          .Resources[resource];

      if (originalFunctionResource === undefined) {
        throw new Error(
          `Function Resource {${module}, ${resource}} does not exist.`
        );
      }

      if (originalFunctionResource.Type !== resourceType_Function) {
        throw new Error(
          `Function Resource {${module}, ${resource}} must be of type ${resourceType_Function}`
        );
      }

      if (originalFunctionResource[keywordExtend.keyword] !== undefined) {
        throw new Error(
          `Function Resource {${module}, ${resource}} must not contain ${keywordExtend.keyword} keyword`
        );
      }

      if (
        originalFunctionResource.Properties.CodeUri?.[functionKeyword] ===
        undefined
      ) {
        throw new Error(
          `Function Resource {${module}, ${resource}} must contain ${functionKeyword} keyword in its CodeUri Property`
        );
      }

      if (!this.store[module]) {
        this.store[module] = {};
      }
      this.store[module][resource] = await this._getFinalFunctionResource(
        context,
        module,
        resource
      );
    }
    return this.store[module][resource];
  }

  private static async _getFinalFunctionResource(
    context: IContext,
    module: string,
    resource: string
  ): Promise<FinalFunctionResource> {
    const extendedFuncResource = context.serverlessTemplateHandler.getResource(
      module,
      resource
    );

    const code: FinalFunctionResource["code"] = {
      function: {
        module: context.serverlessTemplateHandler.getResourcePropertySource(
          ["CodeUri", functionKeyword, "name"],
          extendedFuncResource.propertySourceMap
        ).module,
        name: extendedFuncResource.resource.Properties.CodeUri[functionKeyword]
          .name
      },
      middlewares: []
    };

    const extendedFuncResourceWithExtensions = this._applyExtensionProperties(
      context,
      extendedFuncResource
    );

    const extendedFuncResourcePropertiesWithModuleRefCorrected =
      await this._correctModuleReference(
        context.serverlessTemplateHandler,
        extendedFuncResourceWithExtensions.resource.Properties,
        extendedFuncResourceWithExtensions.propertyModuleMap
      );

    if (
      extendedFuncResourcePropertiesWithModuleRefCorrected["CodeUri"]?.[
        functionKeyword
      ]?.middlewares
    ) {
      extendedFuncResourcePropertiesWithModuleRefCorrected["CodeUri"][
        functionKeyword
      ].middlewares = uniqWith(
        extendedFuncResourcePropertiesWithModuleRefCorrected["CodeUri"][
          functionKeyword
        ].middlewares,
        isEqual
      );
    }

    const middlewares = (extendedFuncResourcePropertiesWithModuleRefCorrected[
      "CodeUri"
    ]?.[functionKeyword]?.middlewares || []) as {
      module: string;
      resource: string;
    }[];

    let propertiesMergedWithMiddlewares =
      extendedFuncResourcePropertiesWithModuleRefCorrected as ServerlessResource["Properties"];

    for (const middleware of middlewares) {
      const extendedMiddlewareResource =
        context.serverlessTemplateHandler.getResource(
          middleware.module,
          middleware.resource
        );

      code.middlewares.push({
        module: context.serverlessTemplateHandler.getResourcePropertySource(
          ["CodeUri", keywordFunctionMiddleware.keyword, "name"],
          extendedMiddlewareResource.propertySourceMap
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
          context.serverlessTemplateHandler,
          extendedMiddlewareResourceProperties,
          extendedMiddlewareResource.propertySourceMap
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
      mergedProperties.Layers = uniqWith(mergedProperties.Layers, isEqual);
    }

    return freeze(
      {
        code,
        resource: {
          ...extendedFuncResourceWithExtensions.resource,
          Properties: propertiesMergedWithMiddlewares
        }
      },
      true
    );
  }

  private static _applyExtensionProperties(
    context: IContext,
    extendedFuncResource: {
      resource: ServerlessResource;
      propertySourceMap: ResourcePropertySourceNode;
    }
  ) {
    const functionType =
      extendedFuncResource.resource.Properties.CodeUri[functionKeyword].type;

    const extensionProperties = {
      CodeUri: {
        [functionKeyword]: {
          middlewares: []
        }
      },
      Layers: []
    };

    context.extensionHandler.functionMiddlewares.forEach(
      extnFuncMiddlewares => {
        const module = extnFuncMiddlewares.extension;
        extnFuncMiddlewares.value.forEach(extnFuncMiddleware => {
          const middlewareResource =
            context.serverlessTemplateHandler.getResource(
              module,
              extnFuncMiddleware
            );
          const allowedTypes = middlewareResource?.resource.Properties
            .CodeUri?.[keywordFunctionMiddleware.keyword]?.allowedTypes || [
            functionType
          ];
          if (allowedTypes.length == 0 || allowedTypes.includes(functionType)) {
            extensionProperties.CodeUri[functionKeyword].middlewares.push({
              module,
              resource: extnFuncMiddleware
            });
          }
        });
      }
    );

    context.extensionHandler.functionLayers.forEach(extnFuncLayers => {
      extnFuncLayers.value.forEach(extnFuncLayer => {
        const module = extnFuncLayers.extension;
        const layerResource = context.serverlessTemplateHandler.getResource(
          module,
          extnFuncLayer
        );
        const allowedTypes = layerResource?.resource.Properties.ContentUri?.[
          keywordFunctionLayer.keyword
        ]?.allowedTypes || [functionType];
        if (allowedTypes.length == 0 || allowedTypes.includes(functionType)) {
          extensionProperties.Layers.push({
            [keywordRef.keyword]: {
              module,
              resource: extnFuncLayer
            }
          });
        }
      });
    });

    const propertiesWithExtensions = JSONObjectMerge(
      extendedFuncResource.resource.Properties,
      extensionProperties,
      {
        [`$.CodeUri["${functionKeyword}"].middlewares`]: "APPEND",
        "$.Layers": "APPEND"
      }
    ) as ServerlessResource["Properties"];

    return {
      resource: {
        ...extendedFuncResource.resource,
        Properties: propertiesWithExtensions
      },
      propertyModuleMap: extendedFuncResource.propertySourceMap
    };
  }

  private static async _correctModuleReference(
    serverlessTemplateHandler: IServerlessTemplateHandler,
    properties: JSONObjectType,
    propertyModuleMap: ResourcePropertySourceNode
  ) {
    // assumption is that the placement of keywords is correct and validated before code execution is reached here

    const updatedProperties = await processKeywords(parseJson(properties), {
      [functionKeyword]: (keyword, node, value: FunctionType) => {
        const keywordPath = [
          "$",
          ...getPath(node),
          functionKeyword,
          "middlewares"
        ];

        const updatedValue = {
          ...value,
          middlewares: value.middlewares?.map((middleware, i) => {
            let module = middleware.module;
            if (module == undefined) {
              module = serverlessTemplateHandler.getResourcePropertySource(
                [...keywordPath, i],
                propertyModuleMap
              ).module;
            }
            return { module, resource: middleware.resource };
          })
        };

        return { type: "keyword", value: { [keyword]: updatedValue } };
      },
      [keywordRef.keyword]: (
        keyword,
        node,
        value: KeywordSomodRef["SOMOD::Ref"]
      ) => {
        const updatedValue = { ...value };
        if (updatedValue.module === undefined) {
          const keywordPath = getPath(node);
          const moduleForThisRef =
            serverlessTemplateHandler.getResourcePropertySource(
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
