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

export type ResourcePropertySourceNode = Readonly<{
  module: string;
  resource: string;
  children: Record<string | number, ResourcePropertySourceNode>;
}>;

export interface IServerlessTemplateHandler {
  /**
   * Returns null if no template found for given module
   */
  getTemplate(module: string): ModuleServerlessTemplate | null;

  listTemplates(): ModuleServerlessTemplate[];

  /**
   * Returns the resource merged with all extended resources
   */
  getResource(
    module: string,
    resource: string
  ): {
    resource: ServerlessResource;
    propertySourceMap: ResourcePropertySourceNode;
  } | null;

  getResourcePropertySource(
    propertyPath: (string | number)[],
    propertyModuleMap: ResourcePropertySourceNode
  ): { module: string; resource: string; depth: number };

  get functionNodeRuntimeVersion(): string;

  getSAMResourceLogicalId(moduleName: string, somodResourceId: string): string;
  getSAMResourceName(moduleName: string, somodResourceName: string): JSONType;
  getSAMOutputName(parameterName: string): string;
  getParameterNameFromSAMOutputName(samOutputName: string): string;
}
