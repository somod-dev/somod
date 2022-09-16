import { JSONSchema7 } from "decorated-ajv";
import {
  somodAjvCompile,
  somodAnd,
  somodEquals,
  somodFunctions,
  somodIf,
  somodJsonParse,
  somodJsonStringify,
  somodKey,
  somodOr,
  somodParameter
} from "../common/keywords";

export const runtimeConfig: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  patternProperties: {
    "^[a-zA-Z][a-zA-Z0-9_]{0,63}$": {
      $ref: "#/definitions/somodFunctions"
    }
  },
  maxProperties: 32,
  errorMessage: {
    additionalProperties:
      "Config Name must contain only Letters, Numbers and Underscore. Must start with letters only"
  }
};

const uiConfig: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema",
  $id: "https://somod.json-schema.sodaru.com/ui-config/index.json",
  title: "JSON Schema for UI Config in SOMOD",
  definitions: {
    somodAjvCompile,
    somodAnd,
    somodEquals,
    somodFunctions,
    somodIf,
    somodJsonParse,
    somodJsonStringify,
    somodKey,
    somodOr,
    somodParameter,
    runtimeConfig
  },
  type: "object",
  additionalProperties: false,
  properties: {
    env: {
      type: "object",
      additionalProperties: false,
      patternProperties: {
        "^[A-Z][A-Z0-9_]{0,63}$": {
          $ref: "#/definitions/somodFunctions"
        }
      },
      maxProperties: 32,
      errorMessage: {
        additionalProperties:
          "Environmental Variable Name must contain only UpperCase Letters, Numbers and Underscore. Must start with letters only"
      }
    },
    imageDomains: {
      type: "array",
      items: {
        anyOf: [
          { type: "string", format: "hostname" },
          {
            $ref: "#/definitions/somodFunctions"
          }
        ]
      },
      maxItems: 16
    },
    publicRuntimeConfig: {
      $ref: "#/definitions/runtimeConfig"
    },
    serverRuntimeConfig: {
      $ref: "#/definitions/runtimeConfig"
    }
  }
};

export default uiConfig;
