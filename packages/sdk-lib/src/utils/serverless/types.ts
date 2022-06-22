import { JSONSchema7 } from "json-schema";

export const KeywordSLPAccess = "SLP::Access";
export const KeywordSLPExtend = "SLP::Extend";
export const KeywordSLPDependsOn = "SLP::DependsOn";
export const KeywordSLPOutput = "SLP::Output";
export const KeywordSLPResourceName = "SLP::ResourceName";
export const KeywordSLPRef = "SLP::Ref";
export const KeywordSLPRefParameter = "SLP::RefParameter";
export const KeywordSLPRefResourceName = "SLP::RefResourceName";
export const KeywordSLPFunction = "SLP::Function";
export const KeywordSLPFunctionLayerLibraries = "SLP::FunctionLayerLibraries";
export const KeywordSLPModuleName = "SLP::ModuleName";
export const KeywordFnSub = "Fn::Sub";

export type KeywordAny =
  | typeof KeywordSLPAccess
  | typeof KeywordSLPExtend
  | typeof KeywordSLPDependsOn
  | typeof KeywordSLPOutput
  | typeof KeywordSLPResourceName
  | typeof KeywordSLPRef
  | typeof KeywordSLPRefParameter
  | typeof KeywordSLPRefResourceName
  | typeof KeywordSLPFunction
  | typeof KeywordSLPFunctionLayerLibraries
  | typeof KeywordSLPModuleName
  | typeof KeywordFnSub;

export const KeywordAll: KeywordAny[] = [
  KeywordSLPAccess,
  KeywordSLPExtend,
  KeywordSLPDependsOn,
  KeywordSLPOutput,
  KeywordSLPResourceName,
  KeywordSLPRef,
  KeywordSLPRefParameter,
  KeywordSLPRefResourceName,
  KeywordSLPFunction,
  KeywordSLPFunctionLayerLibraries,
  KeywordSLPModuleName,
  KeywordFnSub
];

export type SLPAccess = {
  [KeywordSLPAccess]: "module" | "scope" | "public";
};

export type SLPExtend = {
  [KeywordSLPExtend]: { module: string; resource: string };
};

export type SLPDependsOn = {
  [KeywordSLPDependsOn]: { module?: string; resource: string }[];
};

export type SLPOutput = {
  [KeywordSLPOutput]: { default: boolean; attributes: string[] };
};

export type SLPResourceName = {
  [KeywordSLPResourceName]: string;
};

export type SLPRef = {
  [KeywordSLPRef]: {
    module?: string;
    resource: string;
    attribute?: string;
  };
};

export type SLPRefParameter = {
  [KeywordSLPRefParameter]: {
    module?: string;
    parameter: string;
  };
};

export type SLPRefResourceName = {
  [KeywordSLPRefResourceName]: {
    module?: string;
    resource: string;
    property: string;
  };
};

export type SLPFunction = {
  [KeywordSLPFunction]: {
    name: string;
    exclude?: string[];
    customResources?: Record<string, JSONSchema7>;
  };
};

export type SLPFunctionLayerLibraries = {
  LayerName: SLPResourceName;
  [KeywordSLPFunctionLayerLibraries]: string[];
};

export type SLPModuleName = {
  [KeywordSLPModuleName]: string;
};

export type FnSub = {
  [KeywordFnSub]: string | [string, Record<string, unknown>];
};

export type SLPKeyword =
  | SLPExtend
  | SLPDependsOn
  | SLPOutput
  | SLPResourceName
  | SLPRef
  | SLPRefParameter
  | SLPRefResourceName
  | SLPFunction
  | SLPFunctionLayerLibraries
  | SLPModuleName
  | FnSub;

export type SLPResource = {
  Type: string;
  Properties: Record<string, unknown>;
} & Partial<SLPAccess & SLPExtend & SLPDependsOn & SLPOutput>;

export type OriginalSLPTemplate = {
  Parameters?: Record<string, { SAMType: string; schema: JSONSchema7 }>;
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
  Parameters: Record<string, { Type: string }>;
  Resources: Record<
    string,
    {
      Type: string;
      DependsOn?: string[];
      Properties: Record<string, unknown>;
    }
  >;
};
