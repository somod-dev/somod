import { createHash } from "crypto";
import { existsSync } from "fs";
import JSONObjectMerge, { MergedWithReport } from "json-object-merge";
import { readJsonFileStore, readYamlFileStore } from "nodejs-file-utils";
import { join } from "path";
import {
  IModuleHandler,
  IServerlessTemplateHandler,
  JSONType,
  Module,
  ResourcePropertyModuleMapNode,
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
import { ModuleHandler } from "../../moduleHandler";
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

type ServerlessResourceExtendTreeNode = {
  module: string;
  resource: string;
  from: ServerlessResourceExtendTreeNode[];
};

export class ServerlessTemplateHandler implements IServerlessTemplateHandler {
  private moduleHandler: IModuleHandler;

  private serverlessTemplates: Record<string, ServerlessTemplate>;

  private extendedResourceTreeMap: Record<
    string,
    Record<string, ServerlessResourceExtendTreeNode>
  > = {};

  private mergedResources: Record<
    string,
    Record<
      string,
      {
        resource: ServerlessResource;
        propertyModuleMap: ResourcePropertyModuleMapNode;
      }
    >
  >;

  private static handler: IServerlessTemplateHandler;

  private constructor(moduleHandler: IModuleHandler) {
    this.moduleHandler = moduleHandler;
  }

  static getServerlessTemplateHandler(moduleHandler?: IModuleHandler) {
    if (!this.handler) {
      this.handler = new ServerlessTemplateHandler(
        moduleHandler || ModuleHandler.getModuleHandler()
      );
    }
    return this.handler;
  }

  private async _loadBuiltServerlessTemplate(
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

  private async _loadSourceServerlessTemplate(
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

  private async _loadServerlessTemplates() {
    const moduleNodes = await this.moduleHandler.listModules();

    const allTemplates = await Promise.all(
      moduleNodes.map(async moduleNode => {
        const template = moduleNode.module.root
          ? await this._loadSourceServerlessTemplate(moduleNode.module)
          : await this._loadBuiltServerlessTemplate(moduleNode.module);
        if (template) {
          return { module: moduleNode.module.name, template };
        }
      })
    );

    const templates = allTemplates.filter(t => !!t);
    this.serverlessTemplates = Object.fromEntries(
      templates.map(t => [t.module, t.template])
    );
    freeze(this.serverlessTemplates, true);

    templates.reverse();
    for (const { module, template } of templates) {
      this.extendedResourceTreeMap[module] = {};
      for (const resourceId in template.Resources) {
        const resource = template.Resources[resourceId];
        this.extendedResourceTreeMap[module][resourceId] = freeze({
          module,
          resource: resourceId,
          from: []
        });

        if (resource[keywordExtend.keyword]) {
          const { module: extendedModule, resource: extendedResource } =
            resource[keywordExtend.keyword] as Extend;
          this.extendedResourceTreeMap[extendedModule]?.[
            extendedResource
          ]?.from.push(this.extendedResourceTreeMap[module][resourceId]);
        }
      }
    }

    // freeze all from in extendedResourceMap
    for (const module in this.extendedResourceTreeMap) {
      for (const resource in this.extendedResourceTreeMap[module]) {
        freeze(this.extendedResourceTreeMap[module][resource].from);
      }
    }
  }

  private async _load() {
    if (!this.serverlessTemplates) {
      await this._loadServerlessTemplates();
    }
  }

  async getTemplate(moduleName: string) {
    await this._load();
    const template = this.serverlessTemplates[moduleName];
    return template
      ? {
          module: moduleName,
          template
        }
      : null;
  }

  async listTemplates() {
    await this._load();
    return Object.keys(this.serverlessTemplates).map(module => ({
      module,
      template: this.serverlessTemplates[module]
    }));
  }

  private async _getResourceExtendTreeRootNode(
    moduleName: string,
    resourceId: string
  ) {
    const resource =
      this.serverlessTemplates[moduleName]?.Resources[resourceId];

    if (!resource) {
      return null;
    }

    let baseResourceId = { module: moduleName, resource: resourceId };
    let baseResource = resource;
    while (baseResource[keywordExtend.keyword]) {
      const extend = baseResource[keywordExtend.keyword] as Extend;
      baseResource =
        this.serverlessTemplates[extend.module]?.Resources[extend.resource];
      if (baseResource === undefined) {
        throw new Error(
          `Extended resource {${extend.module}, ${extend.resource}} not found. Extended from {${baseResourceId.module}, ${baseResourceId.resource}}`
        );
      }
      baseResourceId = extend;
    }

    return this.extendedResourceTreeMap[baseResourceId.module][
      baseResourceId.resource
    ];
  }

  async getResource(module: string, resource: string) {
    await this._load();

    const resourceExtendedTreeRootNode =
      await this._getResourceExtendTreeRootNode(module, resource);
    if (resourceExtendedTreeRootNode === null) {
      return null;
    }

    return this._mergeExtendedResources(resourceExtendedTreeRootNode);
  }

  getNearestModuleForResourceProperty(
    propertyPath: (string | number)[],
    propertyModuleMap: ResourcePropertyModuleMapNode
  ): { module: string; depth: number } {
    let nearestPropertyModuleMap = propertyModuleMap;
    let i = 0;
    for (; i < propertyPath.length; i++) {
      if (nearestPropertyModuleMap.children[propertyPath[i]] === undefined) {
        break;
      } else {
        nearestPropertyModuleMap =
          nearestPropertyModuleMap.children[propertyPath[i]];
      }
    }
    return {
      module: nearestPropertyModuleMap.module,
      depth: i - 1
    };
  }

  private async _mergeExtendedResources(
    resourceExtendTreeRootNode: ServerlessResourceExtendTreeNode
  ) {
    const { module: rootModule, resource: rootResource } =
      resourceExtendTreeRootNode;

    if (this.mergedResources[rootModule]?.[rootResource] === undefined) {
      const propertyModuleMap: ResourcePropertyModuleMapNode = {
        module: rootModule,
        children: {
          $: {
            module: rootModule,
            children: {}
          }
        }
      };
      let mergedProperties =
        this.serverlessTemplates[rootModule].Resources[rootResource].Properties;
      const extendTreeNodeQueue = [...resourceExtendTreeRootNode.from];
      while (extendTreeNodeQueue.length > 0) {
        const currentTreeNode = extendTreeNodeQueue.shift();
        const currentResource =
          this.serverlessTemplates[currentTreeNode.module].Resources[
            currentTreeNode.resource
          ];
        const mergedResult = JSONObjectMerge(
          mergedProperties,
          currentResource.Properties,
          (currentResource[keywordExtend.keyword] as Extend)?.rules,
          true
        ) as MergedWithReport;
        mergedProperties = mergedResult.merged as Record<string, JSONType>;

        mergedResult.report.updatedPaths.forEach(updatedPath => {
          let propertySegmentModuleMapNode = propertyModuleMap;
          let property = { $: mergedProperties } as JSONType;
          updatedPath.path.forEach(pathSegment => {
            if (
              propertySegmentModuleMapNode.children[pathSegment] === undefined
            ) {
              propertySegmentModuleMapNode.children[pathSegment] = {
                module: propertySegmentModuleMapNode.module,
                children: {}
              };
            }
            propertySegmentModuleMapNode =
              propertySegmentModuleMapNode.children[pathSegment];
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
                  propertySegmentModuleMapNode.children[i] = {
                    module: currentTreeNode.module,
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
                  if (propertySegmentModuleMapNode.children[i] !== undefined) {
                    propertySegmentModuleMapNode.children[i + prependedCount] =
                      propertySegmentModuleMapNode.children[i];
                    delete propertySegmentModuleMapNode.children[i];
                  }
                }
                // prepend
                for (let i = 0; i < prependedCount; i++) {
                  propertySegmentModuleMapNode.children[i] = {
                    module: currentTreeNode.module,
                    children: {}
                  };
                }
              }
              break;
            case "REPLACE":
            case "COMBINE":
              // NOTE: same effect for REPLACE and COMBINE
              // @ts-expect-error propertyModuleMap is not freezed yet, so readonly property `module` can be re-assigned
              propertySegmentModuleMapNode.module = currentTreeNode.module;
              // @ts-expect-error propertyModuleMap is not freezed yet, so readonly property `children` can be re-assigned
              propertySegmentModuleMapNode.children = {};
              break;
          }
        });

        extendTreeNodeQueue.push(...currentTreeNode.from);
      }
      if (this.mergedResources[rootModule] === undefined) {
        this.mergedResources[rootModule] = {};
      }
      const resource = freeze(
        {
          ...this.serverlessTemplates[rootModule].Resources[rootResource],
          Properties: mergedProperties
        },
        true
      );
      freeze(propertyModuleMap, true);
      this.mergedResources[rootModule][rootResource] = {
        resource,
        propertyModuleMap: propertyModuleMap.children["$"]
      };
    }

    return this.mergedResources[rootModule]?.[rootResource];
  }

  getNodeRuntimeVersion(): string {
    return process.env.SOMOD_SERVERLESS_NODEJS_VERSION || "16";
  }

  private hashModuleName(str: string): string {
    return createHash("sha256").update(str).digest("hex").substring(0, 8);
  }

  getSAMResourceLogicalId(moduleName: string, somodResourceId: string) {
    return "r" + this.hashModuleName(moduleName) + somodResourceId;
  }

  getSAMResourceName(moduleName: string, somodResourceName: string) {
    return {
      "Fn::Sub": [
        "somod${stackId}${moduleHash}${somodResourceName}",
        {
          stackId: {
            "Fn::Select": [2, { "Fn::Split": ["/", { Ref: "AWS::StackId" }] }]
          },
          moduleHash: this.hashModuleName(moduleName),
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
