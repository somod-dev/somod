import { JSONSchema7 } from "decorated-ajv";

export const functionLayerResource: JSONSchema7 = {
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
          required: ["RetentionPolicy", "ContentUri"]
        }
      }
    }
  ],
  errorMessage: {
    anyOf:
      "When not extended, Properties must have RetentionPolicy and ContentUri"
  },
  properties: {
    Type: { const: "AWS::Serverless::LayerVersion" },
    Properties: {
      type: "object",
      properties: {
        RetentionPolicy: { const: "Delete" },
        ContentUri: {
          type: "object",
          additionalProperties: false,
          required: ["SOMOD::FunctionLayer"],
          properties: {
            "SOMOD::FunctionLayer": {
              type: "object",
              additionalProperties: false,
              required: ["name"],
              anyOf: [
                { type: "object", required: ["libraries"] },
                { type: "object", required: ["content"] }
              ],
              properties: {
                name: {
                  type: "string",
                  description: "The name of the function layer",
                  pattern: "^[a-zA-Z]+[a-zA-Z0-9]*$"
                },
                libraries: {
                  type: "array",
                  description:
                    "All dependent libraries to be installed in the layer",
                  items: {
                    type: "string",
                    pattern: "^(@[a-z0-9\\-]+\\/){0,1}[a-z0-9\\-]+$"
                  },
                  minItems: 1,
                  maxItems: 32
                },
                content: {
                  type: "object",
                  description:
                    "The Layer Content, map of file-path to file-content",
                  additionalProperties: false,
                  patternProperties: {
                    ".*": {
                      $ref: "#/definitions/stringLike"
                    }
                  },
                  minProperties: 1,
                  maxProperties: 32
                }
              }
            }
          }
        }
      }
    }
  }
};
