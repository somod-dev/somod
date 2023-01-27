import { existsSync } from "fs";
import JSONObjectMerge, { MergedWithReport } from "json-object-merge";
import { readJsonFileStore, readYamlFileStore } from "nodejs-file-utils";
import { join } from "path";
import {
  IContext,
  IModuleHandler,
  IServerlessTemplateHandler,
  JSONType,
  Module,
  ModuleServerlessTemplate,
  ResourcePropertySourceNode,
  ServerlessResource,
  ServerlessTemplate
} from "somod-types";
import {
  file_templateJson,
  file_templateYaml,
  path_build,
  path_serverless
} from "../../constants";
import { freeze } from "../../freeze";
import { keywordAjvCompile } from "../../keywords/ajv-compile";
import { keywordAnd } from "../../keywords/and";
import { keywordEquals } from "../../keywords/equals";
import { keywordIf } from "../../keywords/if";
import { keywordJsonParse } from "../../keywords/json-parse";
import { keywordJsonStringify } from "../../keywords/json-stringify";
import { keywordKey } from "../../keywords/key";
import { keywordOr } from "../../keywords/or";
import { keywordParameter } from "../../keywords/parameter";
import { keywordAccess } from "../keywords/access";
import { keywordCreateIf } from "../keywords/createIf";
import { keywordDependsOn } from "../keywords/dependsOn";
import { Extend, keywordExtend } from "../keywords/extend";
import { keywordFunction } from "../keywords/function";
import { keywordFunctionLayer } from "../keywords/functionLayer";
import { keywordFunctionMiddleware } from "../keywords/functionMiddleware";
import { keywordModuleName } from "../keywords/moduleName";
import { keywordOutput } from "../keywords/output";
import { keywordRef } from "../keywords/ref";
import { keywordResourceName } from "../keywords/resourceName";
import { keywordTemplateOutputs } from "../keywords/templateOutputs";
import { keywordTemplateResources } from "../keywords/templateResources";

export const getBaseKeywords = () => [
  keywordAjvCompile,
  keywordAnd,
  keywordEquals,
  keywordIf,
  keywordJsonParse,
  keywordJsonStringify,
  keywordKey,
  keywordOr,
  keywordParameter,
  keywordAccess,
  keywordCreateIf,
  keywordDependsOn,
  keywordExtend,
  keywordFunction,
  keywordFunctionLayer,
  keywordFunctionMiddleware,
  keywordModuleName,
  keywordOutput,
  keywordRef,
  keywordResourceName,
  keywordTemplateOutputs,
  keywordTemplateResources
];

type ResourceIdentifier = {
  module: string;
  resource: string;
};

type ResourceExtendNode = {
  resource: ResourceIdentifier;
  from: ResourceExtendNode[];
  to?: ResourceExtendNode;
};

type ServerlessResourceWithPropertySourceMap = {
  resource: ServerlessResource;
  propertySourceMap: ResourcePropertySourceNode;
};

export class ExtendUtil {
  static getResourceMap(templateMap: Record<string, ServerlessTemplate>) {
    const resourceExtendMap = this._generateResourceExtendNodeMap(templateMap);
    const resourceMap = this._generateResourceMap(
      templateMap,
      resourceExtendMap
    );
    return resourceMap;
  }

  private static _generateResourceExtendNodeMap(
    templateMap: Record<string, ServerlessTemplate>
  ) {
    const extendNodeMap: Record<
      string, // module
      Record<
        string, // resource
        ResourceExtendNode
      >
    > = {};

    Object.keys(templateMap).forEach(module => {
      const resources = templateMap[module].Resources;
      Object.keys(resources).forEach(resource => {
        if (extendNodeMap[module] === undefined) {
          extendNodeMap[module] = {};
        }
        if (extendNodeMap[module][resource] === undefined) {
          extendNodeMap[module][resource] = {
            resource: { module, resource },
            from: []
          };
        }

        if (resources[resource][keywordExtend.keyword] !== undefined) {
          const to = resources[resource][
            keywordExtend.keyword
          ] as ResourceIdentifier;

          if (templateMap[to.module]?.Resources[to.resource] === undefined) {
            throw new Error(
              `Extended resource {${to.module}, ${to.resource}} not found. Extended from {${module}, ${resource}}.`
            );
          }

          if (extendNodeMap[to.module] === undefined) {
            extendNodeMap[to.module] = {};
          }
          if (extendNodeMap[to.module][to.resource] === undefined) {
            extendNodeMap[to.module][to.resource] = {
              resource: to,
              from: []
            };
          }

          extendNodeMap[to.module][to.resource].from.push(
            extendNodeMap[module][resource]
          );
          extendNodeMap[module][resource].to =
            extendNodeMap[to.module][to.resource];
        }
      });
    });

    return extendNodeMap;
  }

  private static _generateResourceMap(
    templateMap: Record<string, ServerlessTemplate>,
    resourceExtendMap: Record<string, Record<string, ResourceExtendNode>>
  ): Record<string, Record<string, ServerlessResourceWithPropertySourceMap>> {
    const getExtendNodeOfOriginalResource = (
      module: string,
      resource: string
    ) => {
      while (resourceExtendMap[module][resource].to !== undefined) {
        const _module = resourceExtendMap[module][resource].to.resource.module;
        const _resource =
          resourceExtendMap[module][resource].to.resource.resource;
        module = _module;
        resource = _resource;
      }
      return resourceExtendMap[module][resource];
    };

    const resourceMap: Record<
      string,
      Record<string, ServerlessResourceWithPropertySourceMap>
    > = {};

    Object.keys(templateMap).forEach(module => {
      const template = templateMap[module];
      if (resourceMap[module] === undefined) {
        resourceMap[module] = {};
      }
      Object.keys(template.Resources).forEach(resource => {
        const rootNode = getExtendNodeOfOriginalResource(module, resource);
        const { module: rootModule, resource: rootResource } =
          rootNode.resource;
        if (resourceMap[rootModule]?.[rootResource] === undefined) {
          if (resourceMap[rootModule] === undefined) {
            resourceMap[rootModule] = {};
          }
          resourceMap[rootModule][rootResource] = this._mergeExtendedResource(
            rootNode,
            templateMap
          );
        }
        resourceMap[module][resource] = resourceMap[rootModule][rootResource];
      });
    });

    return resourceMap;
  }

  private static _mergeExtendedResource(
    resourceExtendNode: ResourceExtendNode,
    templateMap: Record<string, ServerlessTemplate>
  ) {
    const { module: rootModule, resource: rootResource } =
      resourceExtendNode.resource;

    const propertySourceMap: ResourcePropertySourceNode = {
      module: rootModule,
      resource: rootResource,
      children: {
        $: {
          module: rootModule,
          resource: rootResource,
          children: {}
        }
      }
    };
    let mergedProperties =
      templateMap[rootModule].Resources[rootResource].Properties;
    const extendTreeNodeQueue = [...resourceExtendNode.from];
    while (extendTreeNodeQueue.length > 0) {
      const currentTreeNode = extendTreeNodeQueue.shift();
      const currentResource =
        templateMap[currentTreeNode.resource.module].Resources[
          currentTreeNode.resource.resource
        ];
      const mergedResult = JSONObjectMerge(
        mergedProperties,
        currentResource.Properties,
        (currentResource[keywordExtend.keyword] as Extend)?.rules,
        true
      ) as MergedWithReport;
      mergedProperties = mergedResult.merged as Record<string, JSONType>;

      mergedResult.report.updatedPaths.forEach(updatedPath => {
        let propertySegmentSourceMapNode = propertySourceMap;
        let property = { $: mergedProperties } as JSONType;
        updatedPath.path.forEach(pathSegment => {
          if (
            propertySegmentSourceMapNode.children[pathSegment] === undefined
          ) {
            propertySegmentSourceMapNode.children[pathSegment] = {
              module: propertySegmentSourceMapNode.module,
              resource: propertySegmentSourceMapNode.resource,
              children: {}
            };
          }
          propertySegmentSourceMapNode =
            propertySegmentSourceMapNode.children[pathSegment];
          property = property[pathSegment];
        });
        switch (updatedPath.operation) {
          case "APPEND":
            {
              const mergedArrayLength = (property as unknown[]).length || 0;
              for (
                let i = mergedArrayLength - updatedPath.count;
                i < mergedArrayLength;
                i++
              ) {
                propertySegmentSourceMapNode.children[i] = {
                  module: currentTreeNode.resource.module,
                  resource: currentTreeNode.resource.resource,
                  children: {}
                };
              }
            }
            break;
          case "PREPEND":
            {
              const prependedCount = updatedPath.count;
              const mergedArrayLength = (property as unknown[]).length || 0;
              for (
                let i = mergedArrayLength - prependedCount - 1;
                i >= 0;
                i--
              ) {
                // move the existing properties right
                if (propertySegmentSourceMapNode.children[i] !== undefined) {
                  propertySegmentSourceMapNode.children[i + prependedCount] =
                    propertySegmentSourceMapNode.children[i];
                  delete propertySegmentSourceMapNode.children[i];
                }
              }
              // prepend
              for (let i = 0; i < prependedCount; i++) {
                propertySegmentSourceMapNode.children[i] = {
                  module: currentTreeNode.resource.module,
                  resource: currentTreeNode.resource.resource,
                  children: {}
                };
              }
            }
            break;
          case "REPLACE":
          case "COMBINE":
            // NOTE: same effect for REPLACE and COMBINE
            // @ts-expect-error propertyModuleMap is not freezed yet, so readonly property `module` can be re-assigned
            propertySegmentSourceMapNode.module =
              currentTreeNode.resource.module;
            // @ts-expect-error propertyModuleMap is not freezed yet, so readonly property `module` can be re-assigned
            propertySegmentSourceMapNode.resource =
              currentTreeNode.resource.resource;
            // @ts-expect-error propertyModuleMap is not freezed yet, so readonly property `children` can be re-assigned
            propertySegmentSourceMapNode.children = {};
            break;
        }
      });

      extendTreeNodeQueue.push(...currentTreeNode.from);
    }

    return {
      resource: {
        ...templateMap[rootModule].Resources[rootResource],
        Properties: mergedProperties
      },
      propertySourceMap: propertySourceMap.children["$"]
    };
  }

  static getResourcePropertySource(
    propertyPath: (string | number)[],
    propertyModuleMap: ResourcePropertySourceNode
  ): { module: string; resource: string; depth: number } {
    const _propertyPath = [...propertyPath];
    if (_propertyPath[0] === "$") {
      _propertyPath.shift();
    }

    let nearestPropertyModuleMap = propertyModuleMap;

    let i = 0;
    for (; i < _propertyPath.length; i++) {
      if (nearestPropertyModuleMap.children[_propertyPath[i]] === undefined) {
        break;
      } else {
        nearestPropertyModuleMap =
          nearestPropertyModuleMap.children[_propertyPath[i]];
      }
    }
    return {
      module: nearestPropertyModuleMap.module,
      resource: nearestPropertyModuleMap.resource,
      depth: i - 1
    };
  }
}

export class ServerlessTemplateHandler implements IServerlessTemplateHandler {
  private static instance: IServerlessTemplateHandler;

  private _templateMap: Record<string, ServerlessTemplate> = {};

  private _resourceMap: Record<
    string, // module
    Record<
      string, // resource
      {
        resource: ServerlessResource;
        propertySourceMap: ResourcePropertySourceNode;
      }
    >
  >;

  private _getModuleHash: (moduleName: string) => string;

  private constructor() {
    // do nothing
  }

  static async getInstance(context: IContext) {
    if (this.instance === undefined) {
      const handler = new ServerlessTemplateHandler();

      handler._templateMap = await this._loadTemplates(context.moduleHandler);
      handler._resourceMap = ExtendUtil.getResourceMap(handler._templateMap);
      freeze(handler._templateMap);
      freeze(handler._resourceMap);
      handler._getModuleHash = context.getModuleHash;

      this.instance = handler;
    }
    return this.instance;
  }

  private static async _loadBuiltServerlessTemplate(
    module: Module
  ): Promise<ServerlessTemplate | undefined> {
    const templateLocation = join(
      module.packageLocation,
      path_build,
      path_serverless,
      file_templateJson
    );

    if (existsSync(templateLocation)) {
      const template = (await readJsonFileStore(
        templateLocation
      )) as ServerlessTemplate;

      return template;
    }
  }

  private static async _loadSourceServerlessTemplate(
    module: Module
  ): Promise<ServerlessTemplate | undefined> {
    const templateLocation = join(
      module.packageLocation,
      path_serverless,
      file_templateYaml
    );

    if (existsSync(templateLocation)) {
      const template = (await readYamlFileStore(
        templateLocation
      )) as ServerlessTemplate;

      return template;
    }
  }

  private static async _loadTemplates(moduleHandler: IModuleHandler) {
    const moduleServerlessTemplates: ModuleServerlessTemplate[] =
      await Promise.all(
        moduleHandler.list.map(async ({ module }) => {
          const template = module.root
            ? await this._loadSourceServerlessTemplate(module)
            : await this._loadBuiltServerlessTemplate(module);

          return template ? { module: module.name, template } : undefined;
        })
      );

    const templateMap: Record<string, ServerlessTemplate> = {};
    moduleServerlessTemplates.forEach(moduleServerlessTemplate => {
      if (moduleServerlessTemplate) {
        templateMap[moduleServerlessTemplate.module] =
          moduleServerlessTemplate.template;
      }
    });
    return templateMap;
  }

  getTemplate(module: string) {
    const template = this._templateMap[module];
    return template
      ? {
          module: module,
          template
        }
      : null;
  }

  listTemplates() {
    return Object.keys(this._templateMap).map(module => ({
      module,
      template: this._templateMap[module]
    }));
  }

  getResource(module: string, resource: string) {
    return this._resourceMap[module][resource] || null;
  }

  getResourcePropertySource(
    propertyPath: (string | number)[],
    propertyModuleMap: ResourcePropertySourceNode
  ): { module: string; resource: string; depth: number } {
    return ExtendUtil.getResourcePropertySource(
      propertyPath,
      propertyModuleMap
    );
  }

  get functionNodeRuntimeVersion(): string {
    return process.env.SOMOD_SERVERLESS_NODEJS_VERSION || "16";
  }

  getSAMResourceLogicalId(moduleName: string, somodResourceId: string) {
    return "r" + this._getModuleHash(moduleName) + somodResourceId;
  }

  getSAMResourceName(moduleName: string, somodResourceName: string) {
    return {
      "Fn::Sub": [
        "somod${stackId}${moduleHash}${somodResourceName}",
        {
          stackId: {
            "Fn::Select": [2, { "Fn::Split": ["/", { Ref: "AWS::StackId" }] }]
          },
          moduleHash: this._getModuleHash(moduleName),
          somodResourceName: somodResourceName
        }
      ]
    };
  }

  getSAMOutputName(parameterName: string) {
    return "o" + Buffer.from(parameterName).toString("hex");
  }

  getParameterNameFromSAMOutputName(samOutputName: string): string {
    return Buffer.from(samOutputName.substring(1), "hex").toString();
  }
}
