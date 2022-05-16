import { findReferences } from "../keywords/ref";
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
  // clean baseLayer
  const baseLayerReferences = findReferences(serverlessTemplate, {
    module: baseModuleName,
    resource: baseLayerName
  });
  if (Object.keys(baseLayerReferences).length == 0) {
    delete serverlessTemplate[baseModuleName].Resources[baseLayerName];
  }
};
