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

  getValidator: async (
    rootDir,
    moduleName,
    moduleHandler,
    serverlessTemplateHandler
  ) => {
    return async (keyword, node, value) => {
      const errors: Error[] = [];

      try {
        validateKeywordPosition(node);

        await Promise.all(
          value.map(async v => {
            try {
              const resource = await getReferencedResource(
                serverlessTemplateHandler,
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
          })
        );
      } catch (e) {
        errors.push(e);
      }

      return errors;
    };
  },

  getProcessor: async (
    rootDir,
    moduleName,
    moduleHandler,
    serverlessTemplateHandler
  ) => {
    return (keyword, node, value) => ({
      type: "keyword",
      value: {
        DependsOn: value.map(v =>
          serverlessTemplateHandler.getSAMResourceLogicalId(
            v.module || moduleName,
            v.resource
          )
        )
      }
    });
  }
};
