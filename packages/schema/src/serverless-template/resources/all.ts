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
    { $ref: "#/definitions/somodExtend" },
    { $ref: "#/definitions/somodAccess" },
    { $ref: "#/definitions/somodDependsOn" },
    { $ref: "#/definitions/somodOutput" },
    { $ref: "#/definitions/somodCreateIf" },
    {
      if: { type: "object", required: ["SOMOD::Extend"] },
      then: {
        type: "object",
        propertyNames: {
          not: {
            enum: [
              "SOMOD::Access",
              "SOMOD::DependsOn",
              "SOMOD::Output",
              "SOMOD::CreateIf"
            ]
          },
          errorMessage:
            "Extended Resource can not have Access, DependsOn, Output or CreateIf keywords"
        }
      },
      errorMessage: {
        if: "Extended Resource can not have Access, DependsOn, Output or CreateIf keywords"
      }
    }
  ]
};
