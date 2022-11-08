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

export interface IServerlessTemplateHandler {
  /**
   * Returns the template after all the SOMOD::Extend are applied to the resources of template in question
   *
   * Returns null if no template found for given module
   */
  getTemplate(moduleName: string): Promise<ModuleServerlessTemplate | null>;

  /**
   * Returns all templates after all the SOMOD::Extend are applied to the resources of each template
   */
  listTemplates(): Promise<ModuleServerlessTemplate[]>;

  /**
   * Returns the base Resource , after all SOMOD::Extend are applied
   *
   * Returns null if no resource found
   */
  getResource(
    moduleName: string,
    resourceId: string
  ): Promise<ServerlessResource | null>;

  getNodeRuntimeVersion(): string;
  getSAMResourceLogicalId(moduleName: string, somodResourceId: string): string;
  getSAMResourceName(moduleName: string, somodResourceName: string): JSONType;
  getSAMOutputName(parameterName: string): string;
  getParameterNameFromSAMOutputName(samOutputName: string): string;
}
