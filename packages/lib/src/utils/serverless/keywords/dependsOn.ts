import { getPath } from "../../jsonTemplate";
import { checkAccess } from "./access";
import { KeywordDefinition } from "somod-types";

type DependsOn = { module?: string; resource: string }[];

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

      const path = getPath(node);
      if (!(path.length == 2 && path[0] == "Resources")) {
        errors.push(
          new Error(`${keyword} is allowed only as Resource Property`)
        );
      } else {
        //NOTE: structure of the value is validated by serverless-schema

        await Promise.all(
          value.map(async v => {
            errors.push(
              ...(await checkAccess(
                serverlessTemplateHandler,
                moduleName,
                v,
                "Depended"
              ))
            );
          })
        );
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
