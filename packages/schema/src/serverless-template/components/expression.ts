import { JSONSchema7 } from "decorated-ajv";

export const samString: JSONSchema7 = { type: "string" };

export const samNumber: JSONSchema7 = { type: "number" };

export const samBoolean: JSONSchema7 = { type: "boolean" };

export const stringLike: JSONSchema7 = {
  oneOf: [
    { $ref: "#/definitions/samString" },
    { $ref: "#/definitions/samBase64" },
    { $ref: "#/definitions/samIf" },
    { $ref: "#/definitions/samFindInMap" },
    { $ref: "#/definitions/samJoin" },
    { $ref: "#/definitions/samSelect" },
    { $ref: "#/definitions/samSub" },
    { $ref: "#/definitions/samRef" },
    { $ref: "#/definitions/somodRef" },
    { $ref: "#/definitions/somodParameter" },
    { $ref: "#/definitions/somodModuleName" },
    { $ref: "#/definitions/somodAjvCompile" },
    { $ref: "#/definitions/somodIf" },
    { $ref: "#/definitions/somodJsonStringify" },
    { $ref: "#/definitions/somodKey" }
  ]
};

export const booleanLike: JSONSchema7 = {
  oneOf: [
    { $ref: "#/definitions/samBoolean" },
    { $ref: "#/definitions/samAnd" },
    { $ref: "#/definitions/samOr" },
    { $ref: "#/definitions/samEquals" },
    { $ref: "#/definitions/samNot" },
    { $ref: "#/definitions/samIf" },
    { $ref: "#/definitions/samFindInMap" },
    { $ref: "#/definitions/samRef" },
    { $ref: "#/definitions/somodRef" },
    { $ref: "#/definitions/somodParameter" },
    { $ref: "#/definitions/somodAnd" },
    { $ref: "#/definitions/somodOr" },
    { $ref: "#/definitions/somodEquals" },
    { $ref: "#/definitions/somodIf" },
    { $ref: "#/definitions/somodKey" }
  ]
};

export const numberLike: JSONSchema7 = {
  oneOf: [
    { $ref: "#/definitions/samNumber" },
    { $ref: "#/definitions/samSelect" },
    { $ref: "#/definitions/samIf" },
    { $ref: "#/definitions/samFindInMap" },
    { $ref: "#/definitions/samRef" },
    { $ref: "#/definitions/somodRef" },
    { $ref: "#/definitions/somodParameter" },
    { $ref: "#/definitions/somodIf" },
    { $ref: "#/definitions/somodKey" }
  ]
};

export const arrayLike: JSONSchema7 = {
  oneOf: [
    { $ref: "#/definitions/samCidr" },
    { $ref: "#/definitions/samGetAZs" },
    { $ref: "#/definitions/samSplit" },
    { $ref: "#/definitions/samIf" },
    { $ref: "#/definitions/samFindInMap" },
    { $ref: "#/definitions/samRef" },
    { $ref: "#/definitions/somodRef" },
    { $ref: "#/definitions/somodParameter" },
    { $ref: "#/definitions/somodIf" },
    { $ref: "#/definitions/somodJsonParse" },
    { $ref: "#/definitions/somodKey" }
  ]
};

export const samBase64: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    "Fn::Base64": { $ref: "#/definitions/stringLike" }
  }
};

export const samCidr: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    "Fn::Cidr": {
      type: "array",
      items: [
        { $ref: "#/definitions/stringLike", description: "ipBlock" },
        { $ref: "#/definitions/numberLike", description: "count" },
        { $ref: "#/definitions/numberLike", description: "cidrBits" }
      ],
      minItems: 3,
      maxItems: 3,
      additionalItems: false
    }
  }
};

export const samAnd: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    "Fn::And": {
      type: "array",
      items: { $ref: "#/definitions/booleanLike" },
      minItems: 1,
      maxItems: 10
    }
  }
};

export const samOr: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    "Fn::Or": {
      type: "array",
      items: { $ref: "#/definitions/booleanLike" },
      minItems: 1,
      maxItems: 10
    }
  }
};

export const samEquals: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    "Fn::Equals": {
      type: "array",
      items: [
        {
          anyOf: [
            { $ref: "#/definitions/stringLike" },
            { $ref: "#/definitions/numberLike" },
            { $ref: "#/definitions/booleanLike" },
            { $ref: "#/definitions/arrayLike" }
          ]
        },
        {
          anyOf: [
            { $ref: "#/definitions/stringLike" },
            { $ref: "#/definitions/numberLike" },
            { $ref: "#/definitions/booleanLike" },
            { $ref: "#/definitions/arrayLike" }
          ]
        }
      ],
      maxItems: 2,
      minItems: 2,
      additionalItems: false
    }
  }
};

export const samIf: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    "Fn::If": {
      type: "array",
      items: [
        { $ref: "#/definitions/samString" },
        {
          anyOf: [
            { $ref: "#/definitions/stringLike" },
            { $ref: "#/definitions/numberLike" },
            { $ref: "#/definitions/booleanLike" },
            { $ref: "#/definitions/arrayLike" }
          ]
        },
        {
          anyOf: [
            { $ref: "#/definitions/stringLike" },
            { $ref: "#/definitions/numberLike" },
            { $ref: "#/definitions/booleanLike" },
            { $ref: "#/definitions/arrayLike" }
          ]
        }
      ],
      maxItems: 3,
      minItems: 3,
      additionalItems: false
    }
  }
};

export const samNot: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    "Fn::Not": {
      type: "array",
      items: [{ $ref: "#/definitions/booleanLike" }],
      maxItems: 1,
      minItems: 1,
      additionalItems: false
    }
  }
};

export const samFindInMap: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    "Fn::FindInMap": {
      type: "array",
      items: [
        { $ref: "#/definitions/samString" },
        { $ref: "#/definitions/stringLike" },
        { $ref: "#/definitions/stringLike" }
      ],
      minItems: 3,
      maxItems: 3,
      additionalItems: false
    }
  }
};

export const samGetAZs: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    "Fn::GetAZs": {
      anyOf: [
        { $ref: "#/definitions/samString" },
        { $ref: "#/definitions/somodRef" },
        {
          $ref: "#/definitions/somodFunctions"
        }
      ]
    }
  }
};

export const samJoin: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    "Fn::Join": {
      type: "array",
      items: [
        { $ref: "#/definitions/samString" },
        {
          anyOf: [
            {
              type: "array",
              items: {
                anyOf: [
                  { $ref: "#/definitions/stringLike" },
                  { $ref: "#/definitions/numberLike" }
                ]
              },
              minItems: 1
            },
            { $ref: "#/definitions/samGetAZs" },
            { $ref: "#/definitions/samIf" },
            { $ref: "#/definitions/samSplit" },
            { $ref: "#/definitions/samSelect" },
            { $ref: "#/definitions/samRef" },
            { $ref: "#/definitions/somodRef" },
            {
              $ref: "#/definitions/somodFunctions"
            }
          ]
        }
      ],
      minItems: 2,
      maxItems: 2,
      additionalItems: false
    }
  }
};

export const samSelect: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    "Fn::Select": {
      type: "array",
      items: [
        {
          anyOf: [
            { $ref: "#/definitions/samNumber" },
            { $ref: "#/definitions/somodFunctions" },
            { $ref: "#/definitions/samFindInMap" }
          ]
        },
        {
          anyOf: [
            { $ref: "#/definitions/samFindInMap" },
            { $ref: "#/definitions/samGetAZs" },
            { $ref: "#/definitions/samIf" },
            { $ref: "#/definitions/samSplit" },
            { $ref: "#/definitions/samRef" },
            { $ref: "#/definitions/somodRef" },
            { $ref: "#/definitions/somodFunctions" }
          ]
        }
      ],
      minItems: 2,
      maxItems: 2,
      additionalItems: false
    }
  }
};

export const samSplit: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    "Fn::Split": {
      type: "array",
      items: [
        { $ref: "#/definitions/samString" },
        {
          anyOf: [
            { $ref: "#/definitions/samString" },
            { $ref: "#/definitions/samBase64" },
            { $ref: "#/definitions/samFindInMap" },
            { $ref: "#/definitions/samGetAZs" },
            { $ref: "#/definitions/samIf" },
            { $ref: "#/definitions/samJoin" },
            { $ref: "#/definitions/samSelect" },
            { $ref: "#/definitions/samSub" },
            { $ref: "#/definitions/samRef" },
            { $ref: "#/definitions/somodRef" },
            { $ref: "#/definitions/somodFunctions" },
            { $ref: "#/definitions/somodModuleName" }
          ]
        }
      ],
      minItems: 2,
      maxItems: 2,
      additionalItems: false
    }
  }
};

export const samSub: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    "Fn::Sub": {
      oneOf: [
        { type: "string", maxLength: 1024 },
        {
          type: "array",
          items: [
            { $ref: "#/definitions/samString" },
            {
              type: "object",
              additionalProperties: false,
              patternProperties: {
                "^[a-zA-Z0-9]+$": {
                  anyOf: [
                    { $ref: "#/definitions/samString" },
                    { $ref: "#/definitions/samBase64" },
                    { $ref: "#/definitions/samFindInMap" },
                    { $ref: "#/definitions/samGetAZs" },
                    { $ref: "#/definitions/samIf" },
                    { $ref: "#/definitions/samJoin" },
                    { $ref: "#/definitions/samSelect" },
                    { $ref: "#/definitions/samRef" },
                    { $ref: "#/definitions/somodRef" },
                    { $ref: "#/definitions/somodFunctions" }
                  ]
                }
              }
            }
          ],
          minItems: 2,
          maxItems: 2,
          additionalItems: false
        }
      ]
    }
  }
};

export const samRef: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  properties: {
    Ref: {
      enum: [
        "AWS::AccountId",
        "AWS::NotificationARNs",
        "AWS::NoValue",
        "AWS::Partition",
        "AWS::Region",
        "AWS::StackId",
        "AWS::StackName",
        "AWS::URLSuffix"
      ]
    }
  }
};
