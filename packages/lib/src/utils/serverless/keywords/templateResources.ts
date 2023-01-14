import { getPath } from "../../jsonTemplate";
import { JSONType, KeywordDefinition } from "somod-types";

type Resources = Record<string, JSONType>;

export const keywordTemplateResources: KeywordDefinition<Resources> = {
  keyword: "Resources",

  getValidator: async () => {
    return () => {
      // no validation as of now
      return [];
    };
  },

  getProcessor: async (moduleName, context) => {
    return (keyword, node, value) => {
      if (getPath(node).length == 0) {
        return {
          type: "keyword",
          value: {
            [keyword]: Object.fromEntries(
              Object.keys(value).map(p => [
                context.getSAMResourceLogicalId(moduleName, p),
                value[p]
              ])
            )
          }
        };
      }
      return {
        type: "keyword",
        value: {
          [keyword]: value
        }
      };
    };
  }
};
