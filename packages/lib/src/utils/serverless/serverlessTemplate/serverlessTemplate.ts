import { createHash } from "crypto";
import { existsSync } from "fs";
import { merge } from "lodash";
import { readJsonFileStore, readYamlFileStore } from "nodejs-file-utils";
import { join } from "path";
import {
  IModuleHandler,
  IServerlessTemplateHandler,
  JSONType,
  Module,
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
import { keywordExtend } from "../keywords/extend";
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

type ServerlessTemplateRaw = {
  Resources: Record<
    string,
    {
      "SOMOD::Extend"?: { module: string; resource: string };
      Type: string;
      Properties: Record<string, JSONType>;
    } & Record<string, JSONType>
  >;
  Outputs?: Record<string, JSONType>;
};

export class ServerlessTemplateHandler implements IServerlessTemplateHandler {
  private moduleHandler: IModuleHandler;

  private serverlessTemplates: Record<string, ServerlessTemplate>;

  private extendedResourceMap: Record<
    string, // stringified JSON { module: string; resource: string } of from resource
    { module: string; resource: string } // target resource
  > = {};

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

  private async loadBuiltServerlessTemplate(
    module: Module
  ): Promise<ServerlessTemplateRaw | undefined> {
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

  private async loadSourceServerlessTemplate(
    module: Module
  ): Promise<ServerlessTemplateRaw | undefined> {
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

  private async loadServerlessTemplates() {
    const moduleNodes = await this.moduleHandler.listModules();

    const allTemplates = await Promise.all(
      moduleNodes.map(async moduleNode => {
        const template = moduleNode.module.root
          ? await this.loadSourceServerlessTemplate(moduleNode.module)
          : await this.loadBuiltServerlessTemplate(moduleNode.module);
        if (template) {
          return { module: moduleNode.module.name, template };
        }
      })
    );

    const templates = allTemplates.filter(t => !!t);
    templates.reverse();
    const templateMap = Object.fromEntries(
      templates.map(t => [t.module, t.template])
    );
    const resourceMap: Record<string, { module: string; resource: string }> =
      {};

    templates.forEach(moduleTemplate => {
      Object.keys(moduleTemplate.template.Resources).forEach(resourceId => {
        const resource = moduleTemplate.template.Resources[resourceId];
        const _extend = resource["SOMOD::Extend"];
        const thisResourceId = JSON.stringify({
          module: moduleTemplate.module,
          resource: resourceId
        });
        resourceMap[thisResourceId] = {
          module: moduleTemplate.module,
          resource: resourceId
        };
        if (_extend) {
          if (_extend.module == moduleTemplate.module) {
            throw new Error(
              `Can not extend the resource ${_extend.resource} in the same module ${_extend.module}. Edit the resource directly`
            );
          }
          const targetResource =
            resourceMap[
              JSON.stringify({
                module: _extend.module, // preserve the order to work in JSON stringify
                resource: _extend.resource
              })
            ];

          if (targetResource === undefined) {
            throw new Error(
              `Extended module resource {${_extend.module}, ${_extend.resource}} not found. Extended from {${moduleTemplate.module}, ${resourceId}}`
            );
          }
          if (
            templateMap[targetResource.module].Resources[
              targetResource.resource
            ].Type != resource.Type
          ) {
            throw new Error(
              `Can extend only same type of resource. ${
                resource.Type
              } can not extend ${
                templateMap[targetResource.module].Resources[
                  targetResource.resource
                ].Type
              }`
            );
          }
          merge(
            templateMap[targetResource.module].Resources[
              targetResource.resource
            ].Properties,
            resource.Properties
          );
          resourceMap[thisResourceId] = targetResource;
        }
      });
    });
    freeze(templateMap, true);
    freeze(resourceMap, true);
    this.serverlessTemplates = templateMap;
    this.extendedResourceMap = resourceMap;
  }

  private async load() {
    if (!this.serverlessTemplates) {
      await this.loadServerlessTemplates();
    }
  }

  async getTemplate(moduleName: string) {
    await this.load();
    const template = this.serverlessTemplates[moduleName];
    return template
      ? {
          module: moduleName,
          template
        }
      : null;
  }

  async listTemplates() {
    await this.load();
    return Object.keys(this.serverlessTemplates).map(module => ({
      module,
      template: this.serverlessTemplates[module]
    }));
  }

  async getResource(moduleName: string, resourceId: string) {
    await this.load();
    const actualResourceId = this.extendedResourceMap[
      JSON.stringify({ module: moduleName, resource: resourceId })
    ] || { module: undefined, resource: undefined };
    const resource =
      this.serverlessTemplates[actualResourceId.module]?.Resources[
        actualResourceId.resource
      ] || null;

    return resource;
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
