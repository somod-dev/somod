import { cloneDeep } from "lodash";
import { baseModuleName } from "..";
import { getToBeBundledLibraries } from "../../../library";
import {
  KeywordSLPFunctionLayerLibraries,
  KeywordSLPOutput,
  KeywordSLPRef,
  KeywordSLPResourceName,
  SLPRef,
  SLPResource,
  SLPTemplate
} from "../../types";

export const baseLayerName = "baseLayer";

export const getBaseLayerSLPResource = async (
  dir: string
): Promise<SLPResource> => {
  const toBeBundledLibraries = await getToBeBundledLibraries(dir, "slp");

  return {
    Type: "AWS::Serverless::LayerVersion",
    Metadata: {
      BuildMethod: "nodejs14.x",
      BuildArchitecture: "arm64"
    },
    [KeywordSLPOutput]: { default: true, attributes: [] },
    Properties: {
      LayerName: { [KeywordSLPResourceName]: baseLayerName },
      Description:
        "Set of npm libraries to be requiired in all Lambda funtions",
      CompatibleArchitectures: ["arm64"],
      CompatibleRuntimes: ["nodejs14.x"],
      RetentionPolicy: "Delete",
      [KeywordSLPFunctionLayerLibraries]: toBeBundledLibraries
    }
  } as SLPResource;
};

export const apply = (slpTemplate: SLPTemplate, resourceId: string) => {
  const layers = (slpTemplate.Resources[resourceId].Properties.Layers ||
    []) as SLPRef[];
  layers.unshift({
    [KeywordSLPRef]: { module: baseModuleName, resource: baseLayerName }
  });
  slpTemplate.Resources[resourceId].Properties.Layers = layers;
  slpTemplate.original.Resources[resourceId].Properties.Layers =
    cloneDeep(layers);
};
