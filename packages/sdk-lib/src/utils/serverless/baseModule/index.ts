import { findReferences } from "../keywords/ref";
import { OriginalSLPTemplate, ServerlessTemplate } from "../types";
import { baseLayerName, getBaseLayerSLPResource } from "./layers/baseLayer";
import {
  customResourceLayerName,
  getCustomResourceLayerSLPResource
} from "./layers/customResourceLayer";
import {
  httpWrapperLayerName,
  gethttpWrapperLayer
} from "./layers/httpWrapperLayer";

export const baseModuleName = "@somod/slp";

export const getBaseModuleOriginalSLPTemplate =
  async (): Promise<OriginalSLPTemplate> => {
    const baseLayer = await getBaseLayerSLPResource();
    const customResourceLayer = await getCustomResourceLayerSLPResource();
    const httpWrapperLayer = await gethttpWrapperLayer();

    const baseModule = {
      Resources: {
        [baseLayerName]: baseLayer,
        [customResourceLayerName]: customResourceLayer,
        [httpWrapperLayerName]: httpWrapperLayer
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

  // clean httpWrapperLayer
  const httpWrapperLayerReferences = findReferences(serverlessTemplate, {
    module: baseModuleName,
    resource: httpWrapperLayerName
  });
  if (Object.keys(httpWrapperLayerReferences).length == 0) {
    delete serverlessTemplate[baseModuleName].Resources[httpWrapperLayerName];
  }
};
