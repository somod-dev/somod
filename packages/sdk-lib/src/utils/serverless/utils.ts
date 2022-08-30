import { createHash } from "crypto";

export const getNodeRuntimeVersion = () => {
  return process.env.SOMOD_SERVERLESS_NODEJS_VERSION || "16";
};

const hashModuleName = (str: string): string => {
  return createHash("sha256").update(str).digest("hex").substring(0, 8);
};

export const getSAMResourceLogicalId = (
  moduleName: string,
  somodResourceId: string
): string => {
  return "r" + hashModuleName(moduleName) + somodResourceId;
};

export const getSAMResourceName = (
  moduleName: string,
  somodResourceName: string
): unknown => {
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

export const getSAMOutputName = (exportParameterName: string) => {
  return "o" + Buffer.from(exportParameterName).toString("hex");
};

export const getParameterNameFromSAMOutputName = (samOutputName: string) => {
  return Buffer.from(samOutputName.substring(1), "hex").toString();
};
