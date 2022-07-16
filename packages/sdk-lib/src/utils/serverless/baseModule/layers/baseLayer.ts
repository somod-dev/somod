import { unixStylePath } from "@solib/cli-base";
import { getPackageLocation, listLibraries } from "@somod/lambda-base-layer";
import { cloneDeep } from "lodash";
import { join } from "path";
import { baseModuleName } from "..";
import {
  KeywordSOMODOutput,
  KeywordSOMODRef,
  KeywordSOMODResourceName,
  SOMODRef,
  SLPResource,
  SLPTemplate
} from "../../types";

export const baseLayerName = "baseLayer";

export const getBaseLayerSLPResource = async (): Promise<SLPResource> => {
  return {
    Type: "AWS::Serverless::LayerVersion",
    [KeywordSOMODOutput]: { default: true, attributes: [] },
    Properties: {
      LayerName: { [KeywordSOMODResourceName]: baseLayerName },
      Description: "Set of npm libraries to be required in all Lambda funtions",
      CompatibleArchitectures: ["arm64"],
      CompatibleRuntimes: ["nodejs14.x"],
      RetentionPolicy: "Delete",
      ContentUri: unixStylePath(join(await getPackageLocation(), "layer"))
    }
  } as SLPResource;
};

export const apply = (slpTemplate: SLPTemplate, resourceId: string) => {
  const layers = (slpTemplate.Resources[resourceId].Properties.Layers ||
    []) as SOMODRef[];
  layers.unshift({
    [KeywordSOMODRef]: { module: baseModuleName, resource: baseLayerName }
  });
  slpTemplate.Resources[resourceId].Properties.Layers = layers;
  slpTemplate.original.Resources[resourceId].Properties.Layers =
    cloneDeep(layers);
};

export const listLayerLibraries = listLibraries;
