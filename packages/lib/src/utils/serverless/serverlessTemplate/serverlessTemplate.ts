import { existsSync } from "fs";
import { readJsonFileStore, readYamlFileStore } from "nodejs-file-utils";
import { join } from "path";
import {
  IContext,
  IModuleHandler,
  IServerlessTemplateHandler,
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
import { keywordExtend } from "../keywords/extend";
import { ExtendUtil } from "../keywords/extend-helper";
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
    return this._resourceMap[module]?.[resource] || null;
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
    return process.env.SOMOD_SERVERLESS_NODEJS_VERSION || "18";
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
