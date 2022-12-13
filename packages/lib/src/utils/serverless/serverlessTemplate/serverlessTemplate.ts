import { createHash } from "crypto";
import { existsSync } from "fs";
import { readJsonFileStore, readYamlFileStore } from "nodejs-file-utils";
import { join } from "path";
import {
  IModuleHandler,
  IServerlessTemplateHandler,
  Module,
  ServerlessResourceExtendMap,
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

export class ServerlessTemplateHandler implements IServerlessTemplateHandler {
  private moduleHandler: IModuleHandler;

  private serverlessTemplates: Record<string, ServerlessTemplate>;

  private extendedResourceMap: Record<
    string,
    Record<string, ServerlessResourceExtendMap>
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

  private async loadSourceServerlessTemplate(
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
    this.serverlessTemplates = Object.fromEntries(
      templates.map(t => [t.module, t.template])
    );
    freeze(this.serverlessTemplates, true);

    templates.reverse();
    for (const { module, template } of templates) {
      this.extendedResourceMap[module] = {};
      for (const resourceId in template.Resources) {
        const resource = template.Resources[resourceId];
        this.extendedResourceMap[module][resourceId] = freeze({
          module,
          resource: resourceId,
          from: []
        });

        if (resource[keywordExtend.keyword]) {
          const { module: extendedModule, resource: extendedResource } =
            resource[keywordExtend.keyword] as Extend;
          this.extendedResourceMap[extendedModule]?.[
            extendedResource
          ]?.from.push(this.extendedResourceMap[module][resourceId]);
        }
      }
    }

    // freeze all from in extendedResourceMap
    for (const module in this.extendedResourceMap) {
      for (const resource in this.extendedResourceMap[module]) {
        freeze(this.extendedResourceMap[module][resource].from);
      }
    }
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

  async getResourceExtendMap(moduleName: string, resourceId: string) {
    await this.load();
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

    return this.extendedResourceMap[baseResourceId.module][
      baseResourceId.resource
    ];
  }

  /**
   * @deprecated
   * TODO: remove this
   */
  async getResource(module: string, resource: string) {
    const resourceExtendedMap = await this.getResourceExtendMap(
      module,
      resource
    );
    return (
      this.serverlessTemplates[resourceExtendedMap.module]?.Resources[
        resourceExtendedMap.resource
      ] || null
    );
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
