import { unixStylePath } from "@sodaru/cli-base";
import {
  getLocation,
  layerLibraries,
  ResourceAttributesType,
  ResourceAWSServerlessLayerVersion
} from "@somod/common-layers";
import { cloneDeep } from "lodash";
import { join } from "path";
import {
  KeywordSLPOutput,
  KeywordSLPRef,
  KeywordSLPResourceName,
  SLPRef,
  SLPResource,
  SLPTemplate
} from "../../types";

export const apply = (
  slpTemplate: SLPTemplate,
  resourceId: string,
  moduleName: string,
  layerName: string
) => {
  const layers = (slpTemplate.Resources[resourceId].Properties.Layers ||
    []) as SLPRef[];
  layers.unshift({
    [KeywordSLPRef]: { module: moduleName, resource: layerName }
  });
  slpTemplate.Resources[resourceId].Properties.Layers = layers;
  slpTemplate.original.Resources[resourceId].Properties.Layers =
    cloneDeep(layers);
};

export const getLayerSLPResource = async (
  attributes: ResourceAttributesType
): Promise<SLPResource> => {
  return {
    Type: attributes.type ?? ResourceAWSServerlessLayerVersion,
    [KeywordSLPOutput]: { default: true, attributes: [] },
    Properties: {
      LayerName: { [KeywordSLPResourceName]: attributes.name },
      Description: attributes.description,
      CompatibleArchitectures: attributes.compatibleArchitectures ?? ["arm64"],
      CompatibleRuntimes: attributes.compatibleRuntimes ?? ["nodejs14.x"],
      RetentionPolicy: attributes.retentionPolicy,
      ContentUri: unixStylePath(join(await getLocation(), "layers", "base"))
    }
  } as SLPResource;
};

export const getAllLayersSLPResource = async () => {
  const slpResources: Record<string, SLPResource> = {};
  Object.keys(layerLibraries).forEach(async layer => {
    slpResources[layer["name"]] = await getLayerSLPResource(
      layerLibraries[layer]
    );
  });

  return slpResources;
};
