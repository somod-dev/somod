import { getPath } from "../../jsonTemplate";
import { checkAccess } from "./access";
import {
  IServerlessTemplateHandler,
  JSONObjectNode,
  JSONPrimitiveNode,
  KeywordDefinition
} from "somod-types";
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

const makeSureTheResourceIsNotExtendedInSameModule = (
  moduleName: string,
  value: Extend
) => {
  if (value.module === moduleName) {
    throw new Error(
      `Can not extend the resource ${value.resource} in the same module ${moduleName}. Edit the resource directly`
    );
  }
};

const makeSureTheResourceExtendsSameType = (
  node: JSONObjectNode,
  value: Extend,
  serverlessTemplateHandler: IServerlessTemplateHandler
) => {
  const fromType = (node.properties["Type"] as JSONPrimitiveNode).value;
  const toType = serverlessTemplateHandler.getResource(
    value.module,
    value.resource
  ).resource.Type;

  if (fromType !== toType) {
    throw new Error(
      `Can extend only same type of resource. ${fromType} can not extend ${toType}`
    );
  }
};

export const keywordExtend: KeywordDefinition<Extend> = {
  keyword: "SOMOD::Extend",

  getValidator: async (moduleName, context) => {
    return (keyword, node, value) => {
      const errors: Error[] = [];

      try {
        validateKeywordPosition(node);
        makeSureTheResourceIsNotExtendedInSameModule(moduleName, value);
        makeSureTheResourceExtendsSameType(
          node,
          value,
          context.serverlessTemplateHandler
        );

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
