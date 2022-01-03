import { JSONSchema7Definition } from "json-schema";

export const moduleNameSchema: JSONSchema7Definition = {
  type: "string",
  pattern: "^(@[a-z0-9\\-]+\\/)?[a-z0-9\\-]+$",
  maxLength: 128
};
