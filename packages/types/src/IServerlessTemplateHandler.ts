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

export type ServerlessResourceExtendMap = Readonly<{
  module: string;
  resource: string;
  from: ServerlessResourceExtendMap[];
}>;

export interface IServerlessTemplateHandler {
  /**
   * Returns null if no template found for given module
   */
  getTemplate(module: string): Promise<ModuleServerlessTemplate | null>;

  listTemplates(): Promise<ModuleServerlessTemplate[]>;

  /**
   * returns the ServerlessResourceExtendMap for the original resource that is extended
   *
   * returns null if no resource found
   */
  getResourceExtendMap(
    module: string,
    resource: string
  ): Promise<ServerlessResourceExtendMap | null>;

  /**
   * @deprecated
   * TODO: remove this
   */
  getResource(
    module: string,
    resource: string
  ): Promise<ServerlessResource | null>;

  getNodeRuntimeVersion(): string;
  getSAMResourceLogicalId(moduleName: string, somodResourceId: string): string;
  getSAMResourceName(moduleName: string, somodResourceName: string): JSONType;
  getSAMOutputName(parameterName: string): string;
  getParameterNameFromSAMOutputName(samOutputName: string): string;
}
