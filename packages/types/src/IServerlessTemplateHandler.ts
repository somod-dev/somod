import { JSONType } from "./JsonTemplate";

export type ServerlessResource = Readonly<
  {
    Type: string;
    Properties: Record<string, JSONType>;
  } & Record<string, JSONType>
>;

export type ServerlessTemplate = Readonly<{
  Resources: Readonly<Record<string, ServerlessResource>>;
  Outputs?: Readonly<Record<string, JSONType>>;
}>;

export type ModuleServerlessTemplate = Readonly<{
  module: string;
  template: ServerlessTemplate;
}>;

export type ResourcePropertyModuleMapNode = Readonly<{
  module: string;
  children: Record<string | number, ResourcePropertyModuleMapNode>;
}>;

export interface IServerlessTemplateHandler {
  /**
   * Returns null if no template found for given module
   */
  getTemplate(module: string): Promise<ModuleServerlessTemplate | null>;

  listTemplates(): Promise<ModuleServerlessTemplate[]>;

  /**
   * Returns the resource merged with all extended resources
   */
  getResource(
    module: string,
    resource: string
  ): Promise<{
    resource: ServerlessResource;
    propertyModuleMap: ResourcePropertyModuleMapNode;
  } | null>;

  getNearestModuleForResourceProperty(
    propertyPath: (string | number)[],
    propertyModuleMap: ResourcePropertyModuleMapNode
  ): { module: string; depth: number };

  getNodeRuntimeVersion(): string;
  getSAMResourceLogicalId(moduleName: string, somodResourceId: string): string;
  getSAMResourceName(moduleName: string, somodResourceName: string): JSONType;
  getSAMOutputName(parameterName: string): string;
  getParameterNameFromSAMOutputName(samOutputName: string): string;
}
