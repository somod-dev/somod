import {
  GetNodeRuntimeVersionType,
  GetParameterNameFromSAMOutputNameType,
  GetSAMOutputNameType,
  GetSAMResourceLogicalIdType,
  GetSAMResourceNameType
} from "@somod/types/dist/ServerlessUtils";
import { createHash } from "crypto";

export const getNodeRuntimeVersion: GetNodeRuntimeVersionType = () => {
  return process.env.SOMOD_SERVERLESS_NODEJS_VERSION || "16";
};

const hashModuleName = (str: string): string => {
  return createHash("sha256").update(str).digest("hex").substring(0, 8);
};

export const getSAMResourceLogicalId: GetSAMResourceLogicalIdType = (
  moduleName,
  somodResourceId
) => {
  return "r" + hashModuleName(moduleName) + somodResourceId;
};

export const getSAMResourceName: GetSAMResourceNameType = (
  moduleName,
  somodResourceName
) => {
  return {
    "Fn::Sub": [
      "somod${stackId}${moduleHash}${somodResourceName}",
      {
        stackId: {
          "Fn::Select": [2, { "Fn::Split": ["/", { Ref: "AWS::StackId" }] }]
        },
        moduleHash: hashModuleName(moduleName),
        somodResourceName: somodResourceName
      }
    ]
  };
};

export const getSAMOutputName: GetSAMOutputNameType = parameterName => {
  return "o" + Buffer.from(parameterName).toString("hex");
};

export const getParameterNameFromSAMOutputName: GetParameterNameFromSAMOutputNameType =
  samOutputName => {
    return Buffer.from(samOutputName.substring(1), "hex").toString();
  };
