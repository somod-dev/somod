import { isReferenced } from "../keywords/ref";
import { OriginalSLPTemplate, ServerlessTemplate } from "../types";
import { baseLayerName, getBaseLayerSLPResource } from "./layers/baseLayer";

export const baseModuleName = "@somod/slp";

export const getBaseModuleOriginalSLPTemplate =
  async (): Promise<OriginalSLPTemplate> => {
    const baseLayer = await getBaseLayerSLPResource();

    const baseModule = {
      Resources: {
        [baseLayerName]: baseLayer
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
