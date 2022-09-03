import { JSONType } from "./JsonTemplate";

export type GetNodeRuntimeVersionType = () => string;

export type GetSAMResourceLogicalIdType = (
  moduleName: string,
  somodResourceId: string
) => string;

export type GetSAMResourceNameType = (
  moduleName: string,
  somodResourceName: string
) => JSONType;

export type GetSAMOutputNameType = (parameterName: string) => string;

export type GetParameterNameFromSAMOutputNameType = (
  samOutputName: string
) => string;
