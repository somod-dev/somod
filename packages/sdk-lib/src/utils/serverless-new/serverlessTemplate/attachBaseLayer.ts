import { unixStylePath } from "@solib/cli-base";
import { getPackageLocation } from "@somod/lambda-base-layer";
import { join } from "path";
import {
  resourceType_Function,
  resourceType_FunctionLayer
} from "../../constants";
import { getSAMResourceLogicalId } from "../../serverless/utils";
import { SAMTemplate } from "../types";

const baseModuleName = "@somod/somod";

const baseLayerSOMODResourceId = "BaseLayer";

const baseLayerSAMResourceId = getSAMResourceLogicalId(
  baseModuleName,
  baseLayerSOMODResourceId
);

export const attachBaseLayer = async (samTemplate: SAMTemplate) => {
  const functions = Object.values(samTemplate.Resources).filter(
    resource => resource.Type == resourceType_Function
  );

  if (functions.length > 0) {
    functions.forEach(funResource => {
      const layers = (funResource.Properties.Layers as { Ref: string }[]) || [];
      layers.unshift({ Ref: baseLayerSAMResourceId });
      funResource.Properties.Layers = layers;
    });

    samTemplate.Resources = {
      [baseLayerSAMResourceId]: {
        Type: resourceType_FunctionLayer,
        Properties: {
          Description:
            "Set of npm libraries to be required in all Lambda funtions",
          RetentionPolicy: "Delete",
          ContentUri: unixStylePath(join(await getPackageLocation(), "layer"))
        }
      },
      ...samTemplate.Resources
    };
  }
};
