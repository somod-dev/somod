import { JSONSchema7 } from "json-schema";

export const KeywordSOMODAccess = "SOMOD::Access";
export const KeywordSOMODExtend = "SOMOD::Extend";
export const KeywordSOMODDependsOn = "SOMOD::DependsOn";
export const KeywordSOMODOutput = "SOMOD::Output";
export const KeywordSOMODResourceName = "SOMOD::ResourceName";
export const KeywordSOMODRef = "SOMOD::Ref";
export const KeywordSOMODParameter = "SOMOD::Parameter";
export const KeywordSOMODRefResourceName = "SOMOD::RefResourceName";
export const KeywordSOMODFunction = "SOMOD::Function";
export const KeywordSOMODFunctionLayerLibraries =
  "SOMOD::FunctionLayerLibraries";
export const KeywordSOMODFunctionLayerContent = "SOMOD::FunctionLayerContent";
export const KeywordSOMODModuleName = "SOMOD::ModuleName";
export const KeywordFnSub = "Fn::Sub";

export type KeywordAny =
  | typeof KeywordSOMODAccess
  | typeof KeywordSOMODExtend
  | typeof KeywordSOMODDependsOn
  | typeof KeywordSOMODOutput
  | typeof KeywordSOMODResourceName
  | typeof KeywordSOMODRef
  | typeof KeywordSOMODParameter
  | typeof KeywordSOMODRefResourceName
  | typeof KeywordSOMODFunction
  | typeof KeywordSOMODFunctionLayerLibraries
  | typeof KeywordSOMODFunctionLayerContent
  | typeof KeywordSOMODModuleName
  | typeof KeywordFnSub;

export const KeywordAll: KeywordAny[] = [
  KeywordSOMODAccess,
  KeywordSOMODExtend,
  KeywordSOMODDependsOn,
  KeywordSOMODOutput,
  KeywordSOMODResourceName,
  KeywordSOMODRef,
  KeywordSOMODParameter,
  KeywordSOMODRefResourceName,
  KeywordSOMODFunction,
  KeywordSOMODFunctionLayerLibraries,
  KeywordSOMODFunctionLayerContent,
  KeywordSOMODModuleName,
  KeywordFnSub
];

export type SOMODAccess = {
  [KeywordSOMODAccess]: "module" | "scope" | "public";
};

export type SOMODExtend = {
  [KeywordSOMODExtend]: { module: string; resource: string };
};

export type SOMODDependsOn = {
  [KeywordSOMODDependsOn]: { module?: string; resource: string }[];
};

export type SOMODOutput = {
  [KeywordSOMODOutput]: {
    default: boolean;
    attributes: string[];
    export?: Record<string, string>;
  };
};

export type SOMODResourceName = {
  [KeywordSOMODResourceName]: string;
};

export type SOMODRef = {
  [KeywordSOMODRef]: {
    module?: string;
    resource: string;
    attribute?: string;
  };
};

export type SOMODParameter = {
  [KeywordSOMODParameter]: string;
};

export type SOMODRefResourceName = {
  [KeywordSOMODRefResourceName]: {
    module?: string;
    resource: string;
    property: string;
  };
};

export type SOMODFunction = {
  [KeywordSOMODFunction]: {
    name: string;
    exclude?: string[];
    customResources?: Record<string, JSONSchema7>;
  };
};

export type SOMODFunctionLayerLibraries = {
  LayerName: SOMODResourceName;
  [KeywordSOMODFunctionLayerLibraries]: string[];
};

export type SOMODFunctionLayerContent = {
  LayerName: SOMODResourceName;
  [KeywordSOMODFunctionLayerContent]: Record<string, string>;
};

export type SOMODModuleName = {
  [KeywordSOMODModuleName]: string;
};

export type FnSub = {
  [KeywordFnSub]: string | [string, Record<string, unknown>];
};

export type SOMODKeyword =
  | SOMODExtend
  | SOMODDependsOn
  | SOMODOutput
  | SOMODResourceName
  | SOMODRef
  | SOMODParameter
  | SOMODRefResourceName
  | SOMODFunction
  | SOMODFunctionLayerLibraries
  | SOMODFunctionLayerContent
  | SOMODModuleName
  | FnSub;

export type SLPResource = {
  Type: string;
  Properties: Record<string, unknown>;
} & Partial<SOMODAccess & SOMODExtend & SOMODDependsOn & SOMODOutput>;

export type OriginalSLPTemplate = {
  Resources: Record<string, SLPResource>;
};

export type SLPTemplate = OriginalSLPTemplate & {
  module: string;
  packageLocation: string;
  root: boolean;
  keywordPaths: Record<KeywordAny, string[][]>;
  original: OriginalSLPTemplate;
};

export type ServerlessTemplate = Record<string, SLPTemplate>;

export type SAMTemplate = {
  Parameters?: Record<string, { Type: string }>;
  Resources: Record<
    string,
    {
      Type: string;
      DependsOn?: string[];
      Properties: Record<string, unknown>;
    }
  >;
  Outputs?: Record<
    string,
    {
      Description: string;
      Value: { Ref: string } | { "Fn::GetAtt": [string, string] };
    }
  >;
};
