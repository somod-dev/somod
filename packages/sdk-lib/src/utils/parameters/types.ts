// must match the Parameter in @somod/parameters-schema

export type Parameter = {
  type: string;
  default?: string;
} & Record<string, unknown>;

export type Parameters = {
  Parameters?: Record<string, Parameter>;
};

export type ParameterValues = Record<string, unknown>;
