import { difference } from "lodash";
import { KeywordDefinition } from "../../keywords/types";
import { getSAMResourceLogicalId } from "../../serverless/utils";
import { ServerlessTemplate } from "../types";
import { checkAccess } from "./access";
import { checkCustomResourceSchema } from "./function";
import { checkOutput } from "./output";

export const keyword = "SOMOD::Ref";

type Ref = {
  module?: string;
  resource: string;
  attribute?: string;
};

export const keywordRef: KeywordDefinition<Ref, ServerlessTemplate> = {
  keyword: "SOMOD::Ref",

  getValidator: async (rootDir, moduleName, moduleContentMap) => {
    return (keyword, node, value) => {
      const errors: Error[] = [];

      if (Object.keys(node.properties).length > 1) {
        errors.push(
          new Error(
            `Object with ${keyword} must not have additional properties`
          )
        );
      }

      if (value.resource === undefined) {
        errors.push(new Error(`${keyword} must have "resource" property`));
      }

      const additionalProperties = difference(Object.keys(value), [
        "module",
        "resource",
        "attribute"
      ]);
      if (additionalProperties.length > 0) {
        errors.push(
          new Error(
            `${keyword} must not have additional properties (${additionalProperties
              .map(p => `"${p}"`)
              .join(", ")})`
          )
        );
      }

      if (typeof value.resource != "string") {
        errors.push(new Error(`${keyword}.resource must be string`));
      }

      if (value.module !== undefined && typeof value.module != "string") {
        errors.push(new Error(`${keyword}.module must be string`));
      }
      if (value.attribute !== undefined && typeof value.attribute != "string") {
        errors.push(new Error(`${keyword}.attribute must be string`));
      }

      const targetModule = value.module || moduleName;

      if (!moduleContentMap[targetModule]?.json.Resources[value.resource]) {
        errors.push(
          new Error(
            `Referenced module resource {${targetModule}, ${value.resource}} not found.`
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
        ...checkCustomResourceSchema(
          node,
          moduleContentMap[targetModule],
          value.resource
        )
      );

      return errors;
    };
  },

  getProcessor: async (rootDir, moduleName) => (keyword, node, value) => {
    const targetModule = value.module || moduleName;

    const resourceId = getSAMResourceLogicalId(targetModule, value.resource);
    const refValue = value.attribute
      ? { "Fn::GetAtt": [resourceId, value.attribute] }
      : { Ref: resourceId };
    return {
      type: "object",
      value: refValue
    };
  }
};
