import { JSONSchema7 } from "decorated-ajv";

const parameters: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema",
  $id: "https://somod.json-schema.sodaru.com/parameters/index.json",
  title: "JSON Schema for Parameters in SOMOD",
  type: "object",
  additionalProperties: false,
  properties: {
    parameters: {
      type: "object",
      additionalProperties: { $ref: "http://json-schema.org/draft-07/schema" },
      propertyNames: {
        pattern: "^[a-zA-Z][a-zA-Z0-9-_.]*$",
        maxLength: 128,
        minLength: 4,
        errorMessage: {
          pattern:
            "Parameter Name must contain only alphaNumerics, dot(.), hyphen(-), and underscore(_). must start with alphabet"
        }
      },
      maxProperties: 64
    }
  }
};

export default parameters;
