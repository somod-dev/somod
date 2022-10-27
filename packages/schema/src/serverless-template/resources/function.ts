import { JSONSchema7 } from "decorated-ajv";

export const functionTypes: JSONSchema7 = {
  // function types is same as the Event Types in AWS::Serverless::Function
  // https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-property-function-eventsource.html
  anyOf: [
    {
      enum: [
        "S3",
        "SNS",
        "Kinesis",
        "DynamoDB",
        "SQS",
        "Api",
        "Schedule",
        // "CloudWatchEvent", EventBridgeRule is preferred over CloudWatchEvent
        "EventBridgeRule",
        "CloudWatchLogs",
        "IoTRule",
        "AlexaSkill",
        "Cognito",
        "HttpApi",
        "MSK",
        "MQ",
        "SelfManagedKafka",
        "CFNCustomResource"
      ]
    },
    { type: "string", minLength: 1, maxLength: 32, pattern: "^[a-zA-Z0-9]*$" }
  ]
};

export const functionHttpApiEvent: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["Type", "Properties"],
  properties: {
    Type: { const: "HttpApi" },
    Properties: {
      type: "object",
      required: ["Method", "Path", "ApiId"],
      properties: {
        Method: {
          anyOf: [
            { enum: ["GET", "POST", "PUT", "DELETE", "ANY"] },
            { type: "string", pattern: "^[A-Z]+$" }
          ]
        },
        Path: {
          type: "string"
        },
        ApiId: {
          $ref: "#/definitions/somodRef"
        }
      }
    }
  }
};

export const functionApiEvent: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["Type", "Properties"],
  properties: {
    Type: { const: "Api" },
    Properties: {
      type: "object",
      required: ["Method", "Path", "RestApiId"],
      properties: {
        Method: {
          anyOf: [
            { enum: ["GET", "POST", "PUT", "DELETE", "ANY"] },
            { type: "string", pattern: "^[A-Z]+$" }
          ]
        },
        Path: {
          type: "string"
        },
        RestApiId: {
          $ref: "#/definitions/somodRef"
        }
      }
    }
  }
};

export const functionEvent: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["Type", "Properties"],
  properties: {
    Type: { $ref: "#/definitions/functionTypes" },
    Properties: {
      type: "object"
    }
  }
};

export const functionEventSource: JSONSchema7 = {
  allOf: [
    {
      $ref: "#/definitions/functionEvent"
    },
    {
      if: {
        type: "object",
        properties: { Type: { const: "HttpApi" } }
      },
      then: {
        $ref: "#/definitions/functionHttpApiEvent"
      }
    },
    {
      if: {
        type: "object",
        properties: { Type: { const: "Api" } }
      },
      then: {
        $ref: "#/definitions/functionApiEvent"
      }
    }
  ]
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
          required: ["SOMOD::Function"],
          properties: {
            "SOMOD::Function": {
              type: "object",
              additionalProperties: false,
              required: ["type", "name"],
              properties: {
                type: { $ref: "#/definitions/functionTypes" },
                name: {
                  type: "string",
                  description:
                    "The name of the function, this is the file name of es module under 'serverless/functions' directory (without file extension)",
                  pattern: "^[a-zA-Z]+[a-zA-Z0-9]*$"
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
                },
                middlewares: {
                  type: "array",
                  minItems: 1,
                  maxItems: 16,
                  items: {
                    $ref: "#/definitions/somodRef"
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
            "Layers attached to the funtion, If a layer are refered using SOMOD::Ref, the npm packages in the layer are excluded from the function bundle",
          items: {
            $ref: "#/definitions/stringLike"
          },
          maxItems: 5,
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
