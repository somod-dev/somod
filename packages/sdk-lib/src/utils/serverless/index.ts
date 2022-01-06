import {
  checkForRepeatedModules,
  getModuleGraph,
  toChildFirstList,
  toList
} from "../module";
import { apply as applyDependsOn } from "./keywords/dependsOn";
import { apply as applyExtend } from "./keywords/extend";
import {
  apply as applyFunction,
  prepare as prepareFunction
} from "./keywords/function";
import {
  apply as applyFunctionLayerLibraries,
  prepare as prepareFunctionLayerLibraries
} from "./keywords/functionLayerLibraries";
import { apply as applyOutput } from "./keywords/output";
import { apply as applyRef } from "./keywords/ref";
import { apply as applyRefParameter } from "./keywords/refParameter";
import { apply as applyRefResourceName } from "./keywords/refResourceName";
import { apply as applyResourceName } from "./keywords/resourceName";
import {
  buildRootSLPTemplate,
  loadSLPTemplate,
  loadSLPTemplates,
  mergeSLPTemplates,
  SLPTemplateType,
  validate
} from "./slpTemplate";
import { KeywordSLPExtend, SAMTemplate } from "./types";
import { getSAMParameterName, getSAMResourceLogicalId } from "./utils";

export const buildTemplateJson = async (
  dir: string,
  moduleIndicators: string[]
): Promise<void> => {
  const rootModuleNode = await getModuleGraph(dir, moduleIndicators);

  const allModuleNodes = toList(rootModuleNode); // to be improved in module code
  checkForRepeatedModules(allModuleNodes); // to be improved in module code

  const allChildModules = toChildFirstList(rootModuleNode);
  allChildModules.pop(); // remove the root module

  const allChildSlpTemplates = await loadSLPTemplates(allChildModules);

  const rootSlpTemplate = await loadSLPTemplate(rootModuleNode, "source"); // root slp template.yaml must exist
  const serverlessTemplate = mergeSLPTemplates(allChildSlpTemplates);

  validate(rootSlpTemplate, serverlessTemplate);

  await buildRootSLPTemplate(rootModuleNode);
};

export const generateSamTemplate = async (
  dir: string,
  moduleIndicators: string[]
): Promise<SAMTemplate> => {
  const rootModuleNode = await getModuleGraph(dir, moduleIndicators);

  const allModules = toChildFirstList(rootModuleNode);
  const templateTypes = new Array<SLPTemplateType>(allModules.length).fill(
    "dependent"
  );
  if (templateTypes.pop()) {
    templateTypes.push("build"); // load from build for root module
  }
  const allSlpTemplates = await loadSLPTemplates(allModules, templateTypes);

  const serverlessTemplate = mergeSLPTemplates(allSlpTemplates);

  applyFunction(serverlessTemplate);
  applyFunctionLayerLibraries(serverlessTemplate);
  applyResourceName(serverlessTemplate);
  applyRef(serverlessTemplate);
  applyRefParameter(serverlessTemplate);
  applyRefResourceName(serverlessTemplate);
  applyDependsOn(serverlessTemplate);
  applyOutput(serverlessTemplate);
  applyExtend(serverlessTemplate);

  await Promise.all([
    prepareFunction(dir, serverlessTemplate),
    prepareFunctionLayerLibraries(dir, serverlessTemplate)
  ]);

  const samTemplate: SAMTemplate = { Parameters: {}, Resources: {} };

  Object.values(serverlessTemplate).forEach(slpTemplate => {
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
