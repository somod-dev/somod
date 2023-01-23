import { JSONSchema7 } from "decorated-ajv";

export const functionMiddlewareResource: JSONSchema7 = {
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
          required: ["CodeUri"],
          properties: {
            CodeUri: {
              type: "object",
              properties: {
                "SOMOD::FunctionMiddleware": {
                  type: "object",
                  required: ["name"]
                }
              }
            }
          }
        }
      }
    }
  ],
  errorMessage: {
    anyOf: "When not extended, Properties must have CodeUri"
  },
  properties: {
    Type: { const: "SOMOD::Serverless::FuntionMiddleware" },
    Properties: {
      type: "object",
      properties: {
        CodeUri: {
          type: "object",
          required: ["SOMOD::FunctionMiddleware"],
          additionalProperties: false,
          properties: {
            "SOMOD::FunctionMiddleware": {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description:
                    "The name of the function middleware, this is the file name of es module under 'serverless/functions/middlewares' directory (without file extension)",
                  pattern: "^[a-zA-Z]+[a-zA-Z0-9]*$"
                },
                allowedTypes: {
                  type: "array",
                  description:
                    "Type of the funtion to which this middleware can be applied to. If not specified or left empty, the middleware is allowed for all type of functions",
                  items: {
                    $ref: "#/definitions/functionTypes"
                  }
                }
              }
            }
          }
        },
        Environment: {
          type: "object",
          additionalProperties: false,
          properties: {
            Variables: {
              type: "object",
              additionalProperties: {
                $ref: "#/definitions/stringLike"
              },
              propertyNames: {
                pattern: "^[A-Za-z_][A-Za-z0-9_]*$"
              }
            }
          }
        },
        Layers: {
          type: "array",
          description:
            "Functions Layers to be added to applied functions, If a layer are refered using SOMOD::Ref, the npm packages in the layer are excluded from the function bundle",
          items: {
            $ref: "#/definitions/stringLike"
          },
          maxItems: 5,
          uniqueItems: true
        }
      }
    }
  }
};
