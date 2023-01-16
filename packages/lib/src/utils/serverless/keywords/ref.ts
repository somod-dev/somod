import { JSONSchema7, validate } from "decorated-ajv";
import {
  IServerlessTemplateHandler,
  JSONObjectNode,
  KeywordDefinition
} from "somod-types";
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

const validateKeywordPositionAndSchema = async (
  node: JSONObjectNode,
  value: Ref
) => {
  if (Object.keys(node.properties).length > 1) {
    throw new Error(
      `Object with ${keywordRef.keyword} must not have additional properties`
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

  const violations = await validate(valueSchema, value);
  if (violations.length > 0) {
    throw new Error(
      `Has following errors\n${violations
        .map(v => `${v.path} ${v.message}`.trim())
        .join("\n")}`
    );
  }
};

export const keywordRef: KeywordDefinition<Ref> = {
  keyword: "SOMOD::Ref",

  getValidator: async (moduleName, context) => {
    return async (keyword, node, value) => {
      const errors: Error[] = [];

      try {
        await validateKeywordPositionAndSchema(node, value);

        const resource = getReferencedResource(
          context.serverlessTemplateHandler,
          value.module || moduleName,
          value.resource
        );

        checkAccess(
          resource.resource,
          value.module || moduleName,
          value.resource,
          moduleName
        );

        checkOutput(
          resource.resource,
          value.module || moduleName,
          value.resource,
          value.attribute
        );

        await checkCustomResourceSchema(resource.resource, node);
      } catch (e) {
        errors.push(e);
      }

      return errors;
    };
  },

  getProcessor: async (moduleName, context) => {
    return (keyword, node, value) => {
      const targetModule = value.module || moduleName;

      const resourceId =
        context.serverlessTemplateHandler.getSAMResourceLogicalId(
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

export const getReferencedResource = (
  serverlessTemplateHandler: IServerlessTemplateHandler,
  module: string,
  resource: string,
  referenceType: "Referenced" | "Extended" | "Depended" = "Referenced"
) => {
  const serverlessResource = serverlessTemplateHandler.getResource(
    module,
    resource
  );

  if (serverlessResource === null) {
    throw new Error(
      `${referenceType} module resource {${module}, ${resource}} not found.`
    );
  }

  return serverlessResource;
};
