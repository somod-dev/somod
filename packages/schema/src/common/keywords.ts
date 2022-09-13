import { JSONSchema7 } from "decorated-ajv";

export const somodFunctions: JSONSchema7 = {
  anyOf: [
    { $ref: "#/definitions/somodAjvCompile" },
    { $ref: "#/definitions/somodAnd" },
    { $ref: "#/definitions/somodOr" },
    { $ref: "#/definitions/somodEquals" },
    { $ref: "#/definitions/somodIf" },
    { $ref: "#/definitions/somodJsonParse" },
    { $ref: "#/definitions/somodJsonStringify" },
    { $ref: "#/definitions/somodKey" },
    { $ref: "#/definitions/somodParameter" },
    true
  ]
};

export const somodAjvCompile: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["SOMOD::AjvCompile"],
  properties: {
    "SOMOD::AjvCompile": {
      anyOf: [
        { $ref: "http://json-schema.org/draft-07/schema" },
        { $ref: "#/definitions/somodFunctions" }
      ]
    }
  }
};

export const somodAnd: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["SOMOD::And"],
  properties: {
    "SOMOD::And": {
      type: "array",
      items: {
        anyOf: [{ type: "boolean" }, { $ref: "#/definitions/somodFunctions" }]
      },
      minItems: 1
    }
  }
};

export const somodOr: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["SOMOD::Or"],
  properties: {
    "SOMOD::Or": {
      type: "array",
      items: {
        anyOf: [{ type: "boolean" }, { $ref: "#/definitions/somodFunctions" }]
      },
      minItems: 1
    }
  }
};

export const somodEquals: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["SOMOD::Equals"],
  properties: {
    "SOMOD::Equals": {
      type: "array",
      items: {
        anyOf: [true, { $ref: "#/definitions/somodFunctions" }]
      },
      minItems: 2,
      maxItems: 2
    }
  }
};

export const somodIf: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["SOMOD::If"],
  properties: {
    "SOMOD::If": {
      type: "array",
      additionalItems: {
        anyOf: [true, { $ref: "#/definitions/somodFunctions" }]
      },
      items: [
        {
          anyOf: [{ type: "boolean" }, { $ref: "#/definitions/somodFunctions" }]
        }
      ],
      minItems: 2,
      maxItems: 3
    }
  }
};

export const somodJsonParse: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["SOMOD::JsonParse"],
  properties: {
    "SOMOD::JsonParse": {
      anyOf: [{ type: "string" }, { $ref: "#/definitions/somodFunctions" }]
    }
  }
};

export const somodJsonStringify: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["SOMOD::JsonStringify"],
  properties: {
    "SOMOD::JsonStringify": {
      anyOf: [true, { $ref: "#/definitions/somodFunctions" }]
    }
  }
};

export const somodKey: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["SOMOD::Key"],
  properties: {
    "SOMOD::Key": {
      type: "array",
      additionalItems: false,
      items: [
        {
          anyOf: [
            { type: "object" },
            { type: "array" },
            { $ref: "#/definitions/somodFunctions" }
          ]
        },
        {
          anyOf: [
            { type: "string" },
            { type: "number" },
            { $ref: "#/definitions/somodFunctions" }
          ]
        }
      ],
      minItems: 2,
      maxItems: 2
    }
  }
};

export const somodParameter: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["SOMOD::Parameter"],
  properties: {
    "SOMOD::Parameter": {
      type: "string",
      description: "Must refer the parameter available for this module"
    }
  }
};
