import { resourceType_Function } from "../../../constants";
import {
  KeywordSOMODAccess,
  KeywordSOMODOutput,
  KeywordSOMODRef,
  SAMTemplate,
  SLPResource
} from "../../types";
import { getParameterSpaceResourceLogicalId } from "../../utils";
import { baseLayerName } from "../layers/baseLayer";
import { lambdaCode } from "./getLambdaCode";
import { parameterSpaceCustomResourceType } from "./types";

export const getParameterResources = async (
  slpParameters: Record<string, string[]>
): Promise<Record<string, SLPResource>> => {
  const parameterSpaceLambdaId = "parameterSpaceCfnLambda";
  const resources: Record<string, SLPResource> = {
    [parameterSpaceLambdaId]: {
      Type: resourceType_Function,
      [KeywordSOMODAccess]: "module",
      [KeywordSOMODOutput]: {
        default: true,
        attributes: ["Arn"]
      },
      Properties: {
        InlineCode: lambdaCode,
        Layers: [{ [KeywordSOMODRef]: { resource: baseLayerName } }]
      }
    }
  };

  Object.keys(slpParameters).forEach(parameterSpace => {
    resources[getParameterSpaceResourceLogicalId(parameterSpace)] = {
      Type: parameterSpaceCustomResourceType,
      [KeywordSOMODAccess]: "public",
      [KeywordSOMODOutput]: {
        default: false,
        attributes: slpParameters[parameterSpace]
      },
      Properties: {
        ServiceToken: {
          [KeywordSOMODRef]: {
            resource: parameterSpaceLambdaId,
            attribute: "Arn"
          }
        },
        parameters: {
          Ref: parameterSpace
        }
      }
    };
  });

  return resources;
};

export const getSAMParametersForParameterSpace = (
  baseModuleResources: Record<string, SLPResource>
): SAMTemplate["Parameters"] => {
  const samParameters: SAMTemplate["Parameters"] = {};
  Object.values(baseModuleResources).forEach(parameterResource => {
    if (parameterResource.Type == parameterSpaceCustomResourceType) {
      const samParameterName = parameterResource.Properties.parameters["Ref"];
      samParameters[samParameterName] = { Type: "String" };
    }
  });
  return samParameters;
};
