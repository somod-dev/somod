import { JSONType, ServerlessResource } from "somod-types";

export type SAMTemplate = {
  Resources: Record<string, ServerlessResource>;
  Outputs?: Record<string, { Value: JSONType }>;
};
