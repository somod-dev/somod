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

/**
 * layer names to be created
 */
export enum CommonLayers {
  baseLayer = "baseLayer",
  customResourceLayer = "customResourceLayer",
  httpWrapperLayer = "httpWrapperLayer"
}
