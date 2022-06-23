import { cleanUpBaseModule } from "./baseModule";
import { apply as applyDependsOn } from "./keywords/dependsOn";
import { apply as applyExtend } from "./keywords/extend";
import {
  apply as applyFunction,
  build as buildFunction
} from "./keywords/function";
import {
  apply as applyFunctionLayerLibraries,
  build as buildFunctionLayerLibraries
} from "./keywords/functionLayerLibraries";
import { apply as applyOutput } from "./keywords/output";
import { apply as applyRef } from "./keywords/ref";
import { apply as applyRefParameter } from "./keywords/refParameter";
import { apply as applyRefResourceName } from "./keywords/refResourceName";
import { apply as applyResourceName } from "./keywords/resourceName";
import { apply as applyModuleName } from "./keywords/moduleName";
import { apply as applyFnSub } from "./keywords/fnSub";
import {
  buildRootSLPTemplate,
  loadOriginalSlpTemplate,
  loadServerlessTemplate,
  NoSLPTemplateError,
  validate
} from "./slpTemplate";
import { KeywordSLPExtend, SAMTemplate, SLPTemplate } from "./types";
import { getSAMParameterName, getSAMResourceLogicalId } from "./utils";
import { Module, ModuleHandler } from "../moduleHandler";
import { namespace_http_api, resourceType_Function } from "../constants";

// must match to the schema of function resource
type FunctionResourceProperties = Record<string, unknown> & {
  Events?: Record<
    string,
    {
      Type: string;
      Properties: Record<string, unknown> & {
        Method: string;
        Path: string;
      };
    }
  >;
};

export const loadHttpApiNamespaces = async (module: Module) => {
  if (!module.namespaces[namespace_http_api]) {
    module.namespaces[namespace_http_api] = [];
    try {
      const originalSlpTemplate = await loadOriginalSlpTemplate(module);

      Object.values(originalSlpTemplate.Resources).forEach(resource => {
        if (resource.Type == resourceType_Function) {
          const resourceProperties =
            resource.Properties as FunctionResourceProperties;
          Object.values(resourceProperties.Events || {}).forEach(event => {
            if (event.Type == "HttpApi") {
              module.namespaces[namespace_http_api].push(
                `${event.Properties.Method} ${event.Properties.Path}`
              );
            }
          });
        }
      });
    } catch (e) {
      if (!(e instanceof NoSLPTemplateError)) {
        throw e;
      }
    }
  }
};

export const buildTemplateJson = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir, moduleIndicators);
  const allModules = await moduleHandler.listModules();

  const serverlessTemplate = await loadServerlessTemplate(allModules);

  const rootModuleNode = allModules[0];

  if (serverlessTemplate[rootModuleNode.module.name]) {
    const rootSlpTemplate = serverlessTemplate[rootModuleNode.module.name];
    delete serverlessTemplate[rootModuleNode.module.name];

    await validate(rootSlpTemplate, serverlessTemplate);

    await buildRootSLPTemplate(rootModuleNode);

    await buildFunction(rootSlpTemplate);
    await buildFunctionLayerLibraries(rootSlpTemplate);
  }
};

export const generateSAMTemplate = async (
  dir: string,
  moduleIndicators: string[]
): Promise<SAMTemplate> => {
  const moduleHandler = ModuleHandler.getModuleHandler(dir, moduleIndicators);
  const allModules = await moduleHandler.listModules();

  const serverlessTemplate = await loadServerlessTemplate(allModules);

  applyModuleName(serverlessTemplate);
  applyFnSub(serverlessTemplate);
  applyFunction(serverlessTemplate);
  applyFunctionLayerLibraries(serverlessTemplate);
  applyResourceName(serverlessTemplate);
  applyRef(serverlessTemplate);
  applyRefParameter(serverlessTemplate);
  applyRefResourceName(serverlessTemplate);
  applyDependsOn(serverlessTemplate);
  applyOutput(serverlessTemplate);
  applyExtend(serverlessTemplate);

  cleanUpBaseModule(serverlessTemplate);

  const samTemplate: SAMTemplate = { Parameters: {}, Resources: {} };

  const allModuleNames = allModules.map(m => m.module.name);

  /**
   * This function defines the order of templates to be merged into SAM Template
   *
   * The Order In which the templates are merged is important to keep all child module's resources before parent's
   *
   * For allModuleNames = [A, B, C] in parent to child order
   * The expected order of templates merging is ['base', C, B, A]
   *
   */
  const slpTemplateCompareFn = (
    slpTemplate1: SLPTemplate,
    slpTemplate2: SLPTemplate
  ) => {
    const slpTemplate1Index = allModuleNames.indexOf(slpTemplate1.module);
    const slpTemplate2Index = allModuleNames.indexOf(slpTemplate2.module);

    if (slpTemplate1Index == -1) {
      return -1;
    }
    if (slpTemplate2Index == -1) {
      return 1;
    }

    return slpTemplate2Index - slpTemplate1Index;
  };

  Object.values(serverlessTemplate)
    .sort(slpTemplateCompareFn)
    .forEach(slpTemplate => {
      if (slpTemplate.Parameters) {
        Object.keys(slpTemplate.Parameters).forEach(slpParameterName => {
          const samParameterName = getSAMParameterName(
            slpTemplate.module,
            slpParameterName
          );
          samTemplate.Parameters[samParameterName] = {
            Type: slpTemplate.Parameters[slpParameterName].SAMType
          };
        });
      }

      Object.keys(slpTemplate.Resources).forEach(slpResourceId => {
        if (!slpTemplate.original.Resources[slpResourceId][KeywordSLPExtend]) {
          const samResourceId = getSAMResourceLogicalId(
            slpTemplate.module,
            slpResourceId
          );
          samTemplate.Resources[samResourceId] =
            slpTemplate.Resources[slpResourceId];
        }
      });
    });

  return samTemplate;
};
