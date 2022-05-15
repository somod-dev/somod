import { unixStylePath } from "@solib/cli-base";
import { getLocation } from "@somod/common-layers";
import { cloneDeep } from "lodash";
import { join } from "path";
import { baseModuleName } from "..";
import {
  KeywordSLPOutput,
  KeywordSLPRef,
  KeywordSLPResourceName,
  SLPRef,
  SLPResource,
  SLPTemplate
} from "../../types";

export const httpWrapperLayerName = "httpWrapperLayer";

export const gethttpWrapperLayer = async (): Promise<SLPResource> => {
  return {
    Type: "AWS::Serverless::LayerVersion",
    [KeywordSLPOutput]: { default: true, attributes: [] },
    Properties: {
      LayerName: { [KeywordSLPResourceName]: httpWrapperLayerName },
      Description: "To create CloudFormation for http wrapper Layer",
      CompatibleArchitectures: ["arm64"],
      CompatibleRuntimes: ["nodejs14.x"],
      RetentionPolicy: "Delete",
      ContentUri: unixStylePath(
        join(await getLocation(), "layers", "httpWrapper")
      )
    }
  } as SLPResource;
};

export const apply = (slpTemplate: SLPTemplate, resourceId: string) => {
  const layers = (slpTemplate.Resources[resourceId].Properties.Layers ||
    []) as SLPRef[];
  layers.unshift({
    [KeywordSLPRef]: {
      module: baseModuleName,
      resource: httpWrapperLayerName
    }
  });
  slpTemplate.Resources[resourceId].Properties.Layers = layers;
  slpTemplate.original.Resources[resourceId].Properties.Layers =
    cloneDeep(layers);
};
