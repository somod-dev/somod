import { JSONSchema7 } from "decorated-ajv";

const parameters: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema",
  $id: "https://somod.json-schema.sodaru.com/parameters/index.json",
  title: "JSON Schema for Parameters in SOMOD",
  type: "object",
  additionalProperties: false,
  properties: {
    Parameters: {
      type: "object",
      additionalProperties: false,
      patternProperties: {
        "^[a-zA-Z][a-zA-Z0-9-_]*(\\.[a-zA-Z0-9-_]+)+$": {
          $ref: "https://form-input-schema.json-schema.sodaru.com/schemas/index.json#/properties/inputs/additionalProperties"
        }
      },
      maxProperties: 32,
      errorMessage: {
        additionalProperties:
          "Parameter Name must contain only alphaNumerics, dot(.), hyphen(-), and underscore(_). must start with alphabet, Must contain atleast one dot"
      }
    },
    Schemas: {
      type: "object",
      additionalProperties: false,
      description: "Additional Schema Rules",
      patternProperties: {
        "^[a-zA-Z][a-zA-Z0-9-_\\.]*$": {
          $ref: "http://json-schema.org/draft-07/schema"
        }
      }
    },
    Groups: {
      type: "object",
      additionalProperties: false,
      description: "Groups of input",
      patternProperties: {
        "^[a-zA-Z][a-zA-Z0-9-_\\.]*$": {
          type: "object",
          properties: {
            label: {
              $ref: "https://form-input-schema.json-schema.sodaru.com/schemas/index.json#/properties/groups/additionalProperties/properties/label"
            },
            helpText: {
              $ref: "https://form-input-schema.json-schema.sodaru.com/schemas/index.json#/properties/groups/additionalProperties/properties/helpText"
            }
          }
        }
      },
      maxProperties: 32
    }
  }
};

export default parameters;
