import { getPath } from "../../jsonTemplate";
import { getSAMResourceLogicalId } from "../utils";
import { ServerlessTemplate } from "../types";
import { JSONType, KeywordDefinition } from "somod-types";

type Resources = Record<string, JSONType>;

export const keywordTemplateResources: KeywordDefinition<
  Resources,
  ServerlessTemplate
> = {
  keyword: "Resources",

  getValidator: async () => {
    return () => {
      // no validation as of now
      return [];
    };
  },

  getProcessor: async (rootDir, moduleName) => (keyword, node, value) => {
    if (getPath(node).length == 0) {
      return {
        type: "keyword",
        value: {
          [keyword]: Object.fromEntries(
            Object.keys(value).map(p => [
              getSAMResourceLogicalId(moduleName, p),
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
  }
};
