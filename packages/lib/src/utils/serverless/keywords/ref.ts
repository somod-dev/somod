import { JSONSchema7, validate } from "decorated-ajv";
import { checkAccess } from "./access";
import { checkCustomResourceSchema } from "./function";
import { checkOutput } from "./output";
import { keywordExtend } from "./extend";
import { KeywordDefinition, ServerlessTemplate } from "somod-types";
import { ServerlessTemplateHandler } from "../serverlessTemplate/serverlessTemplate";

type Ref = {
  module?: string;
  resource: string;
  attribute?: string;
};

export type KeywordSomodRef = {
  "SOMOD::Ref": Ref;
};

export const keywordRef: KeywordDefinition<Ref, ServerlessTemplate> = {
  keyword: "SOMOD::Ref",

  getValidator: async (rootDir, moduleName, moduleContentMap) => {
    return async (keyword, node, value) => {
      const errors: Error[] = [];

      if (Object.keys(node.properties).length > 1) {
        errors.push(
          new Error(
            `Object with ${keyword} must not have additional properties`
          )
        );
      }

      const valueSchema: JSONSchema7 = {
        type: "object",
        additionalProperties: false,
        required: ["resource"],
        properties: {
          module: { type: "string" },
          resource: { type: "string" },
          attribute: { type: "string" }
        }
      };

      try {
        const violations = await validate(valueSchema, value);
        if (violations.length > 0) {
          errors.push(
            new Error(
              `Has following errors\n${violations
                .map(v => `${v.path} ${v.message}`.trim())
                .join("\n")}`
            )
          );
        }
      } catch (e) {
        errors.push(e);
      }

      if (errors.length == 0) {
        const targetModule = value.module || moduleName;

        if (!moduleContentMap[targetModule]?.json.Resources[value.resource]) {
          errors.push(
            new Error(
              `Referenced module resource {${targetModule}, ${value.resource}} not found.`
            )
          );
        } else {
          if (
            moduleContentMap[targetModule].json.Resources[value.resource][
              keywordExtend.keyword
            ] !== undefined
          ) {
            errors.push(
              new Error(
                `Can not reference an extended resource {${targetModule}, ${value.resource}}.`
              )
            );
          }
          errors.push(
            ...checkAccess(
              moduleName,
              moduleContentMap[targetModule],
              value.resource
            )
          );

          errors.push(
            ...checkOutput(
              moduleContentMap[targetModule],
              value.resource,
              value.attribute
            )
          );

          errors.push(
            ...(await checkCustomResourceSchema(
              node,
              moduleContentMap[targetModule],
              value.resource
            ))
          );
        }
      }

      return errors;
    };
  },

  getProcessor: async (rootDir, moduleName) => {
    const serverlessTemplateHandler =
      ServerlessTemplateHandler.getServerlessTemplateHandler();
    return (keyword, node, value) => {
      const targetModule = value.module || moduleName;

      const resourceId = serverlessTemplateHandler.getSAMResourceLogicalId(
        targetModule,
        value.resource
      );
      const refValue = value.attribute
        ? { "Fn::GetAtt": [resourceId, value.attribute] }
        : { Ref: resourceId };
      return {
        type: "object",
        value: refValue
      };
    };
  }
};
