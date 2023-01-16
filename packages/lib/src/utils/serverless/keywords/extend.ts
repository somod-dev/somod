import { getPath } from "../../jsonTemplate";
import { checkAccess } from "./access";
import { JSONObjectNode, KeywordDefinition } from "somod-types";
import { Operation } from "json-object-merge";
import { getReferencedResource } from "./ref";

export type Extend = {
  module: string;
  resource: string;
  rules?: Record<string, Operation>;
};

const validateKeywordPosition = (node: JSONObjectNode) => {
  const path = getPath(node);
  if (!(path.length == 2 && path[0] == "Resources")) {
    throw new Error(
      `${keywordExtend.keyword} is allowed only as Resource Property`
    );
  }
  return path;
};

export const keywordExtend: KeywordDefinition<Extend> = {
  keyword: "SOMOD::Extend",

  getValidator: async (moduleName, context) => {
    return (keyword, node, value) => {
      const errors: Error[] = [];

      try {
        validateKeywordPosition(node);

        const resource = getReferencedResource(
          context.serverlessTemplateHandler,
          value.module,
          value.resource,
          "Extended"
        );

        checkAccess(
          resource.resource,
          value.module,
          value.resource,
          moduleName,
          "Extended"
        );
      } catch (e) {
        errors.push(e);
      }

      return errors;
    };
  },

  getProcessor: async () => () => {
    return {
      type: "object",
      value: undefined // removes the resource
    };
  }
};
