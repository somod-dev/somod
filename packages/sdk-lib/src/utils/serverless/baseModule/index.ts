import { findReferences } from "../keywords/ref";
import { OriginalSLPTemplate, SAMTemplate, ServerlessTemplate } from "../types";
import { baseLayerName, getBaseLayerSLPResource } from "./layers/baseLayer";
import {
  getParameterResources,
  getSAMParametersForParameterSpace
} from "./parameter/parameter";

export const baseModuleName = "@somod/slp";

export const getBaseModuleOriginalSLPTemplate = async (
  parameters: string[]
): Promise<OriginalSLPTemplate> => {
  const baseLayer = await getBaseLayerSLPResource();

  const parameterResources = await getParameterResources(parameters);

  const baseModule = {
    Resources: {
      [baseLayerName]: baseLayer,
      ...parameterResources
    }
  };

  return baseModule;
};

export const cleanUpBaseModule = (serverlessTemplate: ServerlessTemplate) => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const baseModuleResourceNames = Object.keys(
      serverlessTemplate[baseModuleName].Resources
    );

    baseModuleResourceNames.forEach(baseModuleResourceName => {
      // clean baseLayer
      const baseResourceReferences = findReferences(serverlessTemplate, {
        module: baseModuleName,
        resource: baseModuleResourceName
      });
      if (Object.keys(baseResourceReferences).length == 0) {
        delete serverlessTemplate[baseModuleName].Resources[
          baseModuleResourceName
        ];
      }
    });

    if (
      baseModuleResourceNames.length ==
      Object.keys(serverlessTemplate[baseModuleName].Resources).length
    ) {
      // there is no change in last iteration , so break
      break;
    }
  }
};

export const getSAMParameters = (
  serverlessTemplate: ServerlessTemplate
): SAMTemplate["Parameters"] => {
  return getSAMParametersForParameterSpace(
    serverlessTemplate[baseModuleName].Resources
  );
};
