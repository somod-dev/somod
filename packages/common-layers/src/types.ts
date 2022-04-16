export const ResourceAWSServerlessLayerVersion =
  "AWS::Serverless::LayerVersion";

export enum AWSSAMRetentionPolicy {
  Retain = "Retain",
  Delete = "Delete"
}

export type ResourceAttributesType = {
  type?: string;
  name: CommonLayers;
  moduleName?: string;
  description: string;
  retentionPolicy: AWSSAMRetentionPolicy;
  compatibleArchitectures?: string[];
  compatibleRuntimes?: string[];
  libraries: string[];
};

export enum CommonLayers {
  base = "baseLayer",
  customResource = "customResourceLayer",
  httpWrapper = "httpWrapperLayer"
}
