import { findReferences } from "../keywords/ref";
import { OriginalSLPTemplate, ServerlessTemplate } from "../types";
import { baseLayerName, getBaseLayerSLPResource } from "./layers/baseLayer";
import {
  customResourceLayerName,
  getCustomResourceLayerSLPResource
} from "./layers/customResourceLayer";

export const baseModuleName = "@somod/slp";

export const getBaseModuleOriginalSLPTemplate =
  async (): Promise<OriginalSLPTemplate> => {
    const baseLayer = await getBaseLayerSLPResource();
    const customResourceLayer = await getCustomResourceLayerSLPResource();

    const baseModule = {
      Resources: {
        [baseLayerName]: baseLayer,
        [customResourceLayerName]: customResourceLayer
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

  // clean customResourceLayer
  const customResourceLayerReferences = findReferences(serverlessTemplate, {
    module: baseModuleName,
    resource: customResourceLayerName
  });
  if (Object.keys(customResourceLayerReferences).length == 0) {
    delete serverlessTemplate[baseModuleName].Resources[
      customResourceLayerName
    ];
  }
};
