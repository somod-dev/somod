import { JSONSchema7 } from "decorated-ajv";

export const functionEventSource: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["Type", "Properties"],
  properties: {
    Type: {
      type: "string"
    },
    Properties: {
      type: "object"
    }
  },
  if: {
    type: "object",
    properties: {
      Type: { enum: ["HttpApi", "Api"] }
    }
  },
  then: {
    type: "object",
    properties: {
      Properties: {
        type: "object",
        required: ["Method", "Path"],
        properties: {
          Method: {
            anyOf: [
              { enum: ["GET", "POST", "PUT", "DELETE", "ANY"] },
              { type: "string", pattern: "^[A-Z]+$" }
            ]
          },
          Path: {
            type: "string"
          }
        }
      }
    },
    if: {
      type: "object",
      properties: {
        Type: { const: "HttpApi" }
      }
    },
    then: {
      type: "object",
      properties: {
        Properties: {
          type: "object",
          required: ["ApiId"],
          properties: {
            ApiId: {
              $ref: "#/definitions/somodRef"
            }
          }
        }
      }
    },
    else: {
      type: "object",
      properties: {
        Properties: {
          type: "object",
          required: ["RestApiId"],
          properties: {
            RestApiId: {
              $ref: "#/definitions/somodRef"
            }
          }
        }
      }
    }
  }
};

export const functionResource: JSONSchema7 = {
  title: "JSON Schema for Function Resource in Serverless Template of SOMOD",
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
          oneOf: [{ required: ["CodeUri"] }, { required: ["InlineCode"] }]
        }
      }
    }
  ],
  errorMessage: {
    anyOf:
      "When not extended, Properties must have either CodeUri or InlineCode"
  },
  properties: {
    Type: {
      const: "AWS::Serverless::Function"
    },
    Properties: {
      type: "object",
      properties: {
        CodeUri: {
          type: "object",
          additionalProperties: false,
          properties: {
            "SOMOD::Function": {
              type: "object",
              additionalProperties: false,
              required: ["name"],
              properties: {
                name: {
                  type: "string",
                  description:
                    "The name of the function, this is the file name of es module under 'serverless/functions' directory (without file extension)",
                  pattern: "^[a-zA-Z]+[a-zA-Z0-9]*$"
                },
                exclude: {
                  type: "array",
                  description:
                    "libraries to exclude while bundling this function, excluded libraries must be included as layers",
                  items: {
                    type: "string",
                    pattern: "^(@[a-zA-Z0-9\\-_]+\\/)?[a-zA-Z0-9\\-_]+$"
                  },
                  maxItems: 100
                },
                customResources: {
                  type: "object",
                  description:
                    "Define the Schema for the custom resources handled by this function. Schema is indexed by Custom Resource Type with `Custom::` removed. Schema no need to define `ServiceToken` Property",
                  additionalProperties: false,
                  maxProperties: 25,
                  patternProperties: {
                    "^[A-Z][a-zA-Z0-9]{0,63}$": {
                      $ref: "http://json-schema.org/draft-07/schema"
                    }
                  }
                }
              }
            }
          }
        },
        InlineCode: {
          type: "string"
        },
        Layers: {
          type: "array",
          description:
            "@somod/lambda-base-layer is added as default layer to every Serverless function , hence maximum of 4 layer is allowed in somod modules",
          items: {
            $ref: "#/definitions/stringLike"
          },
          maxItems: 4,
          uniqueItems: true
        },
        Events: {
          type: "object",
          additionalProperties: false,
          patternProperties: {
            "^[a-zA-Z0-9]+$": {
              $ref: "#/definitions/functionEventSource"
            }
          }
        }
      }
    }
  }
};
