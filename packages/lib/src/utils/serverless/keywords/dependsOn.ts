import { getPath } from "../../jsonTemplate";
import { checkAccess } from "./access";
import { JSONObjectNode, KeywordDefinition } from "somod-types";
import { getReferencedResource } from "./ref";

export type DependsOn = { module?: string; resource: string }[];

const validateKeywordPosition = (node: JSONObjectNode) => {
  const path = getPath(node);
  if (!(path.length == 2 && path[0] == "Resources")) {
    throw new Error(
      `${keywordDependsOn.keyword} is allowed only as Resource Property`
    );
  }
  return path;
};

export const keywordDependsOn: KeywordDefinition<DependsOn> = {
  keyword: "SOMOD::DependsOn",

  getValidator: async (moduleName, context) => {
    return (keyword, node, value) => {
      const errors: Error[] = [];

      try {
        validateKeywordPosition(node);

        value.map(v => {
          try {
            const resource = getReferencedResource(
              context.serverlessTemplateHandler,
              v.module || moduleName,
              v.resource,
              "Depended"
            );

            checkAccess(
              resource.resource,
              v.module || moduleName,
              v.resource,
              moduleName,
              "Depended"
            );
          } catch (e) {
            errors.push(e);
          }
        });
      } catch (e) {
        errors.push(e);
      }

      return errors;
    };
  },

  getProcessor: async (moduleName, context) => {
    return (keyword, node, value) => ({
      type: "keyword",
      value: {
        DependsOn: value.map(v =>
          context.serverlessTemplateHandler.getSAMResourceLogicalId(
            v.module || moduleName,
            v.resource
          )
        )
      }
    });
  }
};
