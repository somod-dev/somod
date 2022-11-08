import { JSONSchema7, validate } from "decorated-ajv";
import { KeywordDefinition } from "somod-types";
import { ServerlessTemplateHandler } from "../serverlessTemplate/serverlessTemplate";
import { checkAccess } from "./access";
import { checkCustomResourceSchema } from "./function";
import { checkOutput } from "./output";

type Ref = {
  module?: string;
  resource: string;
  attribute?: string;
};

export type KeywordSomodRef = {
  "SOMOD::Ref": Ref;
};

export const keywordRef: KeywordDefinition<Ref> = {
  keyword: "SOMOD::Ref",

  getValidator: async (
    rootDir,
    moduleName,
    moduleHandler,
    serverlessTemplateHandler
  ) => {
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

        const targetResource = await serverlessTemplateHandler.getResource(
          targetModule,
          value.resource
        );

        if (!targetResource) {
          errors.push(
            new Error(
              `Referenced module resource {${targetModule}, ${value.resource}} not found.`
            )
          );
        } else {
          errors.push(...checkAccess(moduleName, value));

          errors.push(
            ...(await checkOutput(
              serverlessTemplateHandler,
              moduleName,
              value.resource,
              value.module,
              value.attribute
            ))
          );

          errors.push(...(await checkCustomResourceSchema(node, moduleName)));
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
