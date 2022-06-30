import { resourceType_Function } from "../../../constants";
import { SAMTemplate, SLPResource } from "../../types";
import { getParameterSpaceResourceLogicalId } from "../../utils";
import { lambdaCode } from "./getLambdaCode";
import { parameterSpaceCustomResourceType } from "./types";

export const getParameterResources = async (
  slpParameters: Record<string, string[]>
): Promise<Record<string, SLPResource>> => {
  const parameterSpaceLambdaId = "parameterSpaceCfnLambda";
  const resources: Record<string, SLPResource> = {
    [parameterSpaceLambdaId]: {
      Type: resourceType_Function,
      "SLP::Access": "module",
      "SLP::Output": {
        default: true,
        attributes: ["Arn"]
      },
      Properties: {
        InlineCode: lambdaCode
      }
    }
  };

  Object.keys(slpParameters).forEach(parameterSpace => {
    resources[getParameterSpaceResourceLogicalId(parameterSpace)] = {
      Type: parameterSpaceCustomResourceType,
      "SLP::Access": "public",
      "SLP::Output": {
        default: false,
        attributes: slpParameters[parameterSpace]
      },
      Properties: {
        ServiceToken: {
          "SLP::Ref": {
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
