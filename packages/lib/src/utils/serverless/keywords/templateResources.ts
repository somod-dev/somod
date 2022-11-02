import { getPath } from "../../jsonTemplate";
import { JSONType, KeywordDefinition, ServerlessTemplate } from "somod-types";
import { ServerlessTemplateHandler } from "../serverlessTemplate/serverlessTemplate";

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

  getProcessor: async (rootDir, moduleName) => {
    const serverlessTemplateHandler =
      ServerlessTemplateHandler.getServerlessTemplateHandler();
    return (keyword, node, value) => {
      if (getPath(node).length == 0) {
        return {
          type: "keyword",
          value: {
            [keyword]: Object.fromEntries(
              Object.keys(value).map(p => [
                serverlessTemplateHandler.getSAMResourceLogicalId(
                  moduleName,
                  p
                ),
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
