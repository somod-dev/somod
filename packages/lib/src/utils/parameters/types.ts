// must match the Parameter in @somod/parameters-schema

import { JSONSchema7 } from "decorated-ajv";

export type Parameters = {
  parameters?: Record<string, JSONSchema7>;
};

export type ParameterValues = Record<string, unknown>;
