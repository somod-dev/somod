import { JSONType } from "@somod/types";

export type ServerlessResource = Readonly<
  {
    Type: string;
    Properties: Record<string, JSONType>;
  } & Record<string, JSONType>
>;

export type ServerlessTemplate = {
  readonly Resources: Readonly<Record<string, ServerlessResource>>;
  readonly Outputs?: Readonly<Record<string, JSONType>>;
};

export type ModuleServerlessTemplate = Readonly<{
  module: string;
  packageLocation: string;
  template: ServerlessTemplate;
  root?: boolean;
}>;

export type ModuleServerlessTemplateMap = Readonly<
  Record<string, ModuleServerlessTemplate>
>;

export type SAMTemplate = {
  Resources: Record<string, ServerlessResource>;
  Outputs?: Record<string, { Value: JSONType }>;
};
