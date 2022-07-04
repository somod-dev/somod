import { isReferenced } from "../keywords/ref";
import { OriginalSLPTemplate, SAMTemplate, ServerlessTemplate } from "../types";
import { baseLayerName, getBaseLayerSLPResource } from "./layers/baseLayer";
import {
  getParameterResources,
  getSAMParametersForParameterSpace
} from "./parameter/parameter";

export const baseModuleName = "@somod/slp";

export const getBaseModuleOriginalSLPTemplate = async (
  slpParameters: Record<string, string[]>
): Promise<OriginalSLPTemplate> => {
  const baseLayer = await getBaseLayerSLPResource();

  const parameterResources = await getParameterResources(slpParameters);

  const baseModule = {
    Resources: {
      [baseLayerName]: baseLayer,
      ...parameterResources
    }
  };

  return baseModule;
};

export const cleanUpBaseModule = (serverlessTemplate: ServerlessTemplate) => {
  const baseModule = serverlessTemplate[baseModuleName];

  const baseModuleResourceNames = Object.keys(baseModule.original.Resources);

  let keepCleaningUp = true;

  while (keepCleaningUp) {
    keepCleaningUp = false;
    baseModuleResourceNames.forEach(baseModuleResourceName => {
      if (baseModule.Resources[baseModuleResourceName]) {
        const hasReference = isReferenced(
          serverlessTemplate,
          baseModuleName,
          baseModuleResourceName
        );
        if (!hasReference) {
          keepCleaningUp = true;
          delete baseModule.Resources[baseModuleResourceName];
        }
      }
    });
  }
};

export const getSAMParameters = (
  serverlessTemplate: ServerlessTemplate
): SAMTemplate["Parameters"] => {
  return getSAMParametersForParameterSpace(
    serverlessTemplate[baseModuleName].Resources
  );
};
