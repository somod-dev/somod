import { JSONSchema7 } from "decorated-ajv";

export const customResource: JSONSchema7 = {
  type: "object",
  required: ["Type", "Properties"],
  anyOf: [
    {
      type: "object",
      required: ["SOMOD::Extend"]
    },
    {
      type: "object",
      properties: {
        Properties: {
          type: "object",
          required: ["ServiceToken"]
        }
      }
    }
  ],
  errorMessage: {
    anyOf: "When not extended, Properties must have ServiceToken"
  },
  properties: {
    Type: { type: "string", pattern: "^Custom::[A-Z][a-zA-Z0-9]{0,63}$" },
    Properties: {
      type: "object",
      properties: {
        ServiceToken: {
          $ref: "#/definitions/somodRef"
        }
      }
    }
  }
};
