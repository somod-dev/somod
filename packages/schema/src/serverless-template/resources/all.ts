import { JSONSchema7 } from "decorated-ajv";

export const allResource: JSONSchema7 = {
  allOf: [
    {
      type: "object",
      required: ["Type", "Properties"],
      properties: {
        Type: { type: "string" },
        Properties: {
          type: "object"
        }
      }
    },
    { $ref: "#/definitions/somodAccess" },
    { $ref: "#/definitions/somodExtend" },
    { $ref: "#/definitions/somodDependsOn" },
    { $ref: "#/definitions/somodOutput" },
    { $ref: "#/definitions/somodCreateIf" }
  ]
};
