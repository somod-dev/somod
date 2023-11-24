import { JSONSchema7 } from "decorated-ajv";

export const somodModuleNamePattern: JSONSchema7 = {
  type: "string",
  pattern: "^(@[a-z0-9-]+\\/)?[a-z0-9-]+$",
  maxLength: 128
};

export const somodResourceLogicalIdPattern: JSONSchema7 = {
  type: "string",
  pattern: "^[a-zA-Z0-9]{1,64}$"
};

export const somodResourceName: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["SOMOD::ResourceName"],
  properties: {
    "SOMOD::ResourceName": {
      type: "string",
      pattern: "^[a-zA-Z]+[a-zA-Z0-9]*$",
      maxLength: 64
    }
  }
};

export const somodRef: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["SOMOD::Ref"],
  properties: {
    "SOMOD::Ref": {
      type: "object",
      additionalProperties: false,
      required: ["resource"],
      properties: {
        resource: { $ref: "#/definitions/somodResourceLogicalIdPattern" },
        module: { $ref: "#/definitions/somodModuleNamePattern" },
        attribute: { type: "string", pattern: "^[a-zA-Z0-9]+$" }
      }
    }
  }
};

export const somodModuleName: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["SOMOD::ModuleName"],
  properties: {
    "SOMOD::ModuleName": {
      const: true
    }
  }
};

export const somodAccess: JSONSchema7 = {
  type: "object",
  properties: {
    "SOMOD::Access": {
      enum: ["module", "scope", "public"]
    }
  }
};

export const somodExtend: JSONSchema7 = {
  type: "object",
  properties: {
    "SOMOD::Extend": {
      type: "object",
      additionalProperties: false,
      required: ["module", "resource"],
      properties: {
        module: { $ref: "#/definitions/somodModuleNamePattern" },
        resource: {
          $ref: "#/definitions/somodResourceLogicalIdPattern"
        },
        rules: {
          type: "object",
          additionalProperties: {
            enum: ["REPLACE", "COMBINE", "APPEND", "PREPEND"]
          }
        }
      }
    }
  }
};

export const somodDependsOn: JSONSchema7 = {
  type: "object",
  properties: {
    "SOMOD::DependsOn": {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["resource"],
        properties: {
          module: {
            $ref: "#/definitions/somodModuleNamePattern"
          },
          resource: {
            $ref: "#/definitions/somodResourceLogicalIdPattern"
          }
        }
      },
      minItems: 1,
      maxItems: 20
    }
  }
};

export const somodOutput: JSONSchema7 = {
  type: "object",
  properties: {
    "SOMOD::Output": {
      type: "object",
      additionalProperties: false,
      properties: {
        default: { type: "boolean" },
        attributes: {
          type: "array",
          items: { type: "string", pattern: "^[a-zA-Z0-9]+$" }
        }
      }
    }
  }
};

export const somodCreateIf: JSONSchema7 = {
  type: "object",
  properties: {
    "SOMOD::CreateIf": {
      $ref: "#/definitions/booleanLike"
    }
  }
};
